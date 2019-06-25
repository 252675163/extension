
import * as vscode from 'vscode';
import { TreeDataProvider, TreeItem,TreeView,window } from 'vscode';
export class Gitlab {
    symbolViewer: TreeView<vscode.TreeItem>;
    constructor(context: vscode.ExtensionContext) {
        vscode.commands.registerCommand("jwx.gitlab.refresh", () => {
            
        });
        let treeDataProvider = new Xb1TreeDataProvider(context);
        this.symbolViewer = window.createTreeView("gitlab", {
            treeDataProvider
          });
    }
}

class SymbolNode extends TreeItem {
    parent?: SymbolNode;
    symbol?: vscode.SymbolInformation;
    children: SymbolNode[];
    info:NodeInfo;
    constructor(symbol?: vscode.SymbolInformation) {
      super("haha");
      this.children = [];
      this.info = new NodeInfo();
      this.symbol = symbol;
    }
  }
  class NodeInfo{
    tooltip?:string;
    label:string='';
    detail:string='';
  }
  class ONode extends NodeInfo{
    pk:string='';
    children:ONode[]=[];
    parent?:ONode;
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
    const root= new SymbolNode();
    const tree = new SymbolNode();
    tree.parent=root;
    tree.info.label="'xb1Extension.js' is not found";
    root.children.push(tree);
    this.tree = root;

  }
  private mixNode(parentNode:SymbolNode,mix:SymbolNode,onode:ONode,symbolNodeArr:vscode.SymbolInformation[]):void{
    if(parentNode){
      mix.parent=parentNode;
      parentNode.children.push(mix);
    }
    mix.info=onode;
    mix.symbol=symbolNodeArr.find(i=>i.name===onode.pk);
    if(onode.children.length>0){
      onode.children.forEach((item)=>{
        let newNode = new SymbolNode();
        this.mixNode(mix,newNode,item,symbolNodeArr);
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

  getParent(node: SymbolNode): SymbolNode|undefined {
    return node.parent;
  }

  getTreeItem(node: SymbolNode): SymbolNode {
    let treeItem = node;
    if (node.children.length) {
      treeItem.collapsibleState =vscode.TreeItemCollapsibleState.Expanded;
    } else {
      treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
    treeItem.label = node.info.label;
    treeItem.tooltip =node.info.tooltip;
    treeItem.info = node.info;
    return treeItem;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }
}