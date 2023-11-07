import { Probot } from 'probot';
import githubActions from '@probot/adapter-github-actions';
import slugify from 'slugify';

const date = new Date();

const app = (app: Probot) => {
  app.on('workflow_dispatch', async (context) => {
    app.log(`Creating release`);
    /**
     * Generate a release title
     */
    const releaseInput = context.payload.inputs?.release_title as
      | string
      | undefined;
    const releaseTitle = slugify(releaseInput || 'release');
    const releaseDate = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;

    const releaseBranch = `release/${releaseDate}-${releaseTitle}`;

    /**
     * Create the release branch
     */
    await context.octokit.rest.git.createRef({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      ref: `refs/heads/${releaseBranch}`,
      sha: context.payload.repository.default_branch,
    });

    /**
     * Find the last release
     */
    const lastRelease = await context.octokit.rest.repos.getLatestRelease({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
    });

    let releaseNotes = 'New release';
    if (lastRelease.data) {
      app.log(`Found last release ${lastRelease.data.tag_name}`);

      /**
       * Determine the difference between the last release and the current release
       */
      const differenceOfCommits =
        await context.octokit.rest.repos.compareCommits({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
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
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        tag_name: `${releaseDate}-${releaseTitle}`,
        target_commitish: context.payload.repository.default_branch,
        name: `${releaseDate} ${releaseInput}`,
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
