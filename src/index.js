const fetch = require('node-fetch');
const fs = require('fs');
const core = require('@actions/core');
const github = require('@actions/github');

// get token and org from env or input
const token = process.env.ORG_TOKEN || core.getInput('org-token');
const org = process.env.ORG_NAME || core.getInput('org-name');

// error out if token or org are not set
if (!token) {
  core.setFailed('ORG_TOKEN is not set. Confirm that the Repo Secret ORG_TOKEN is set in your repo settings and you are passing that as org-token in the caller workflow.');
}
if (!org) {
  core.setFailed('org-name is not set');
}

const query = `
query($org: String!, $cursor: String) {
  organization(login: $org) {
    repositories(first: 100, after: $cursor) {
      nodes {
        nameWithOwner
        collaborators(first: 100) {
          totalCount
          edges {
            permission
            node {
              login
              name
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
}
`;

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};

let result = [];
let cursor = null;
let has_next_page = true;

async function fetchData() {
  try{
    while (has_next_page) {
      const variables = {
        org: org,
        cursor: cursor,
      };
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query: query, variables: variables }),
      });
      const data = await response.json();
      const nodes = data.data.organization.repositories.nodes;
      cursor = data.data.organization.repositories.pageInfo.endCursor;
      has_next_page = data.data.organization.repositories.pageInfo.hasNextPage;

      for (const repo of nodes) {
        const users = [];
        for (const edge of repo.collaborators.edges) {
          if (edge.permission === 'ADMIN') {
            users.push(edge.node.login);
          }
        }
        result.push({ repo: repo.nameWithOwner, users: users });
      }
    }

    const csv = result.map(row => [row.repo, row.users.join(', ')]);
    csv.unshift(['repo', 'admins']);
    const csvData = csv.map(row => row.join(',')).join('\n');
    fs.writeFileSync(`${org}-repo-owners-report.csv`, csvData);
  } catch (error) {
    console.error('Authentication failed. Please check your token and try again.');
    console.error(error);
  }
}

fetchData();