
import * as vscode from 'vscode';
import axios from 'axios';
import { TreeDataProvider, TreeItem, TreeView, window } from 'vscode';
import * as git from 'git-rev-sync';
async function getProjectId(search: string = ''): Promise<string> {
  let id = '';
  let res = await axios({
    method: 'get',
    url: 'http://git.greedyint.com//api/v4/search?scope=projects&search=' + search,
    headers: {
      "Private-Token": "C82n-mpa39SCszUS3pvj"
    }
  });
  console.log(res)
  return id
}
export class Gitlab {
  symbolViewer: TreeView<vscode.TreeItem>;
  remoteUrl: string
  branch: string
  projectId: string = '';
  get namespace(): string {
    let index = this.remoteUrl.indexOf('git.greedyint.com')
    return this.remoteUrl.slice(index + 1)
  }
  get gitlabApiSearch(): string {
    return this.namespace.split('/')[1];
  }
  constructor(context: vscode.ExtensionContext) {
    vscode.commands.registerCommand("jwx.gitlab.refresh", () => {

    });
    let treeDataProvider = new Xb1TreeDataProvider(context);
    this.symbolViewer = window.createTreeView("gitlab", {
      treeDataProvider
    });
    this.branch = git.branch();
    this.remoteUrl = git.remoteUrl();
    getProjectId(this.gitlabApiSearch).then(res => {
      this.projectId = res
    })
  }

}


export class Xb1TreeDataProvider
  implements TreeDataProvider<SymbolNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<SymbolNode | null> = new vscode.EventEmitter<SymbolNode | null>();
  readonly onDidChangeTreeData: vscode.Event<SymbolNode | null> = this
    ._onDidChangeTreeData.event;
  private context: vscode.ExtensionContext;
  private tree: SymbolNode;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.tree = new SymbolNode();
  }

  //   private getSymbols(uri:vscode.Uri): Thenable<vscode.SymbolInformation[]> {
  //     return vscode.commands.executeCommand<vscode.SymbolInformation[]>(
  //       "vscode.executeDocumentSymbolProvider",
  //       uri
  //     );
  //   }


  private async updateSymbols(editor?: vscode.TextEditor): Promise<void> {
    // let configFile=path.join(vscode.workspace.rootPath,"/xb1Extension.js");
    const root = new SymbolNode();
    const tree = new SymbolNode();
    tree.parent = root;
    tree.info.label = "获取git信息中";
    root.children.push(tree);
    this.tree = root;
  }
  private mixNode(parentNode: SymbolNode, mix: SymbolNode, onode: ONode, symbolNodeArr: vscode.SymbolInformation[]): void {
    if (parentNode) {
      mix.parent = parentNode;
      parentNode.children.push(mix);
    }
    mix.info = onode;
    mix.symbol = symbolNodeArr.find(i => i.name === onode.pk);
    if (onode.children.length > 0) {
      onode.children.forEach((item) => {
        let newNode = new SymbolNode();
        this.mixNode(mix, newNode, item, symbolNodeArr);
      });
    }
  }
  async getChildren(node?: SymbolNode): Promise<SymbolNode[]> {
    if (node) {
      return node.children;
    } else {
      await this.updateSymbols(vscode.window.activeTextEditor);
      return this.tree ? this.tree.children : [];
    }
  }

  getParent(node: SymbolNode): SymbolNode | undefined {
    return node.parent;
  }

  getTreeItem(node: SymbolNode): SymbolNode {
    let treeItem = node;
    if (node.children.length) {
      treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    } else {
      treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
    treeItem.label = node.info.label;
    treeItem.tooltip = node.info.tooltip;
    treeItem.info = node.info;
    return treeItem;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }
}

class SymbolNode extends TreeItem {
  parent?: SymbolNode;
  symbol?: vscode.SymbolInformation;
  children: SymbolNode[];
  info: NodeInfo;
  constructor(symbol?: vscode.SymbolInformation) {
    super("");
    this.children = [];
    this.info = new NodeInfo();
    this.symbol = symbol;
  }
}
class NodeInfo {
  tooltip?: string;
  label: string = '';
  detail: string = '';
}
class ONode extends NodeInfo {
  pk: string = '';
  children: ONode[] = [];
  parent?: ONode;
}