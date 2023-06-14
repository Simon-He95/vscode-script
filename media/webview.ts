export function getwebviewScript(props: Record<string, any>) {
  const { treeData, fontSize = '12px', labelColor = 'rgb(209,121,21)', filePathColor = 'rgb(167,134,42)', commandLabelColor = 'rgb(78,119,244)', commandDetailColor = 'rgb(253,183,104)', iconColor = 'rgb(149, 48, 232)' } = props

  return `
  <script>
  const vscode = acquireVsCodeApi()

  const App = {
    data() {
      return {
        iconColor: "${iconColor}",
        commandDetailColor: "${commandDetailColor}",
        commandLabelColor: "${commandLabelColor}",
        filePathColor: "${filePathColor}",
        labelColor: "${labelColor}",
        fontSize: "${fontSize}",
        closeLoading: false,
        maxWidth:'auto',
        dataSource: ${JSON.stringify(treeData)},
      }
    },
    mounted(){
      this.maxWidth = this.setLarge()
      this.closeLoading = true
      window.addEventListener('resize',()=>{
        this.maxWidth = this.setLarge()
      })
    },
    methods:{
      setLarge(){
        const width = window.innerWidth;
        if(width < 480){
          this.large = false
        }else {
          this.large = true
        }
        return width - 220
      },
     run(node, data){
      if(data.children) return
      vscode.postMessage({ type: 'run', value: JSON.stringify(data) })
     },
     view(e, node, data){
      e.stopPropagation()
      vscode.postMessage({ type: 'view', value: JSON.stringify(data) })
     }
    }
  };
  const app = Vue.createApp(App);
  app.use(ElementPlus);
  app.mount("#app");
  </script>
  `
}
