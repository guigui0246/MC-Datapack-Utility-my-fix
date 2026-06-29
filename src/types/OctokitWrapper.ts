import { Octokit, RestEndpointMethodTypes } from '@octokit/rest'
import { setTimeOut } from '../utils'

type TemporaryType = RestEndpointMethodTypes['repos']['getContent']['parameters']

export interface AskGitHubData extends TemporaryType {
  owner: string
  repo: string
  ref: string
  path: string
}

type GetElem<T> = T extends unknown[] ? T[number] : T

export type ReposGetContentResponseData = GetElem<RestEndpointMethodTypes['repos']['getContent']['response']['data']>

const octokit = new Octokit()

function isInPath(filePath: string, basePath: string) {
  const normalized = basePath.endsWith("/") ? basePath : basePath + "/";
  return filePath === basePath || filePath.startsWith(normalized);
}

function toGetContentShape(node: any, owner: string, repo: string, ref: string) {
  const path = node.path as string;
  const name = path.split("/").pop()!;

  return {
    type: "file",
    name,
    path,
    sha: node.sha,
    size: node.size ?? 0,

    // IMPORTANT: include ref everywhere
    url: `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,

    html_url: `https://github.com/${owner}/${repo}/blob/${ref}/${path}`,

    git_url: `https://api.github.com/repos/${owner}/${repo}/git/blobs/${node.sha}`,

    download_url: `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`,

    content: "",
    encoding: "base64",

    _links: {
      self: `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
      git: `https://api.github.com/repos/${owner}/${repo}/git/blobs/${node.sha}`,
      html: `https://github.com/${owner}/${repo}/blob/${ref}/${path}`,
    },
  };
}

export const getGitHubData = async (data: AskGitHubData): Promise<RestEndpointMethodTypes['repos']['getContent']['response']['data']> => {
  const treePromise = octokit.git.getTree({
    owner: data.owner,
    repo: data.repo,
    tree_sha: data.ref,
    recursive: 'true',
  })

  const tree = await Promise.race([
    treePromise,
    setTimeOut(7000),
  ])

  const result = tree.data.tree
  .filter((n) => n.type === "blob" && n.path)
  .filter((n) => !data.path || isInPath(n.path!, data.path))
  .map((node) =>
    toGetContentShape(node, data.owner, data.repo, data.ref)
  );

  return result

}
