/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

// DA POLJUBEN JQUERY PLUGIN DELA V TYPESCRIPTU !!!
interface JQuery {
  select2(options?: any, callback?: Function) : any;
}
/* https://medium.com/@NetanelBasal/typescript-integrate-jquery-plugin-in-your-project-e28c6887d8dc */
