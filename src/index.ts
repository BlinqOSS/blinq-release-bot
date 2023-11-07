import { Probot } from 'probot';
import githubActions from '@probot/adapter-github-actions';
import slugify from 'slugify';

const date = new Date();

const app = (app: Probot) => {
  app.on('workflow_dispatch', async (context) => {
    app.log(`Creating release`);

    const releaseInput = context.payload.inputs?.release_title as
      | string
      | undefined;
    const releaseTitle = slugify(releaseInput || 'release');
    const releaseDate = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;

    const releaseBranch = `release/${releaseDate}-${releaseTitle}`;

    const differenceOfCommits = await context.octokit.rest.repos.compareCommits(
      {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        base: context.payload.repository.default_branch,
        head: releaseBranch,
      }
    );

    app.log(
      `Found ${differenceOfCommits.data.commits.length} commits between ${context.payload.repository.default_branch} and ${releaseBranch}`
    );

    let releaseNotes = differenceOfCommits.data.commits
      .map((commit) => commit.commit.message)
      .join('\n\n');

    // If no commits are found, release notes are not available
    if (releaseNotes.length === 0) {
      releaseNotes = 'No release notes available.';
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
