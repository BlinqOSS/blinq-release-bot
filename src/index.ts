import { Probot } from 'probot';
import githubActions from '@probot/adapter-github-actions';
import slugify from 'slugify';

const date = new Date();

interface Inputs {
  release_title?: string;
  org: string;
  repo: string;
}

const app = (app: Probot) => {
  app.on('workflow_dispatch', async (context) => {
    const inputs = context.payload.inputs as Inputs | null;

    if (!inputs) {
      throw new Error('Missing inputs');
    }

    console.log(context.payload);

    app.log(`Creating release`, {
      owner: inputs.org,
      repo: inputs.repo,
      ref: context.payload.ref,
    });
    /**
     * Generate a release title
     */
    const releaseTitle = slugify(inputs.release_title || 'release');
    const releaseDate = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;

    const releaseBranch = `release/${releaseDate}-${releaseTitle}`;

    /**
     * Get the commit SHA for this workflow dispatch
     */
    const latestCommit = await context.octokit.rest.repos.getCommit({
      owner: inputs.org,
      repo: inputs.repo,
      ref: context.payload.ref,
    });

    if (!latestCommit.data.sha) {
      throw new Error(
        `Could not find latest commit for branch ${releaseBranch}`
      );
    }

    app.log(`Latest commit SHA: ${latestCommit.data.sha}`);

    /**
     * Create the release branch
     */
    app.log(`Creating release branch ${releaseBranch}`, {
      branch: releaseBranch,
      sha: latestCommit.data.sha,
    });
    await context.octokit.rest.git.createRef({
      owner: inputs.org,
      repo: inputs.repo,
      ref: `refs/heads/${releaseBranch}`,
      sha: latestCommit.data.sha,
    });

    /**
     * Find the last release
     */
    const lastRelease = await context.octokit.rest.repos.getLatestRelease({
      owner: inputs.org,
      repo: inputs.repo,
    });

    let releaseNotes = 'New release';
    if (lastRelease.data) {
      app.log(`Found last release ${lastRelease.data.tag_name}`);

      /**
       * Determine the difference between the last release and the current release
       */
      const differenceOfCommits =
        await context.octokit.rest.repos.compareCommits({
          owner: inputs.org,
          repo: inputs.repo,
          base: lastRelease.data.tag_name,
          head: releaseBranch,
        });

      app.log(
        `Found ${differenceOfCommits.data.commits.length} commits between ${context.payload.repository.default_branch} and ${releaseBranch}`
      );

      releaseNotes = differenceOfCommits.data.commits
        .map((commit) => commit.commit.message)
        .join('\n\n');
    }

    try {
      await context.octokit.rest.repos.createRelease({
        owner: inputs.org,
        repo: inputs.repo,
        tag_name: `${releaseDate}-${releaseTitle}`,
        target_commitish: latestCommit.data.sha,
        name: `${releaseDate} ${inputs.release_title ?? 'Release'}`,
        body: releaseNotes,
        draft: false,
        prerelease: false,
      });

      app.log(`Created release ${releaseTitle}`);
    } catch (error) {
      app.log(`Error creating release: ${error}`);
    }
  });
};

githubActions.run(app).catch((error) => {
  console.error(error);
  throw error;
});
