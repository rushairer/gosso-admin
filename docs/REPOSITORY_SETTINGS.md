# Repository Settings

GitHub security alerts, Dependabot security updates, secret scanning, and push protection are enabled for the public repository.

After the new workflows have run successfully on `main`, protect `main` with these rules:

- require pull requests with at least one approving review;
- dismiss stale approvals and require code-owner review;
- require conversation resolution;
- require branches to be current before merge;
- require `Frontend quality`, `Seed quality`, `Compose and preflight`, `codeql`, `dependencies`, and `container-scan` checks;
- apply rules to administrators;
- block force pushes and branch deletion.

Do not enable required check names before the corresponding workflow has run on the default branch, because GitHub cannot satisfy a check that has never been registered.
