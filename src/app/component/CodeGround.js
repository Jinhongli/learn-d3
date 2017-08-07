const demoCodeList = [
`<div id="container">
  <h1>Game of Thrones</h1>
  <ul class="list">
    <li>King: <span class="actor">Jon Snow</span></li>
    <li>Queen: <span class="actor">Daenerys Targaryen</span></li>
    <li>Hand: <span class="actor">Tyrion Lannister</span></li>
  </ul>
</div>`,
`<div id="container">
  <address>
    <strong>Twitter, Inc.</strong><br>
    1355 Market Street, Suite 900<br>
    San Francisco, CA 94103<br>
    <abbr title="Phone">P:</abbr> (123) 456-7890
  </address>
</div>`,
`<div id="container">
  <table class="table table-striped">
    <thead>
      <tr><th>#</th><th>First Name</th><th>Last Name</th><th>Username</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">1</th><td>Mark</td><td>Otto</td><td>@mdo</td></tr>
      <tr><th scope="row">2</th><td>Jacob</td><td>Thornton</td><td>@fat</td></tr>
      <tr><th scope="row">3</th><td>Larry</td><td>the Bird</td><td>@twi</td></tr>
    </tbody>
  </table>
</div>`
];
const html2json = require('html2json').html2json;

glue.define('component.CodeGround', {
    init: function () {
    },
    formatCode: function(code){
        let regex = /(>[\n|\r|\t|\s]*<)/g;
        return code.trim().replace(regex, '><');
    },
    renderHtml: function(code){
        console.log(code);
        this.nodes.htmlBlock.html(code);
    },
    listeners: {
        click: function (event, element, elementType) {
            let code = '';
            let data = {};
            if(elementType === 'convertBtn' && (code=this.nodes.codeInput.val()) ){
                code = this.formatCode(this.nodes.codeInput.val());
            }else if(elementType.indexOf('demoBtn') >= 0){
                code = demoCodeList[parseInt(elementType.substr(-1))-1];
                this.nodes.codeInput.val(code);
            }else{
                return false;
            }
            code = this.formatCode(code);
            try{
                data = html2json(code);
            }catch(e){
                alert(e);
            }
            this.renderHtml(code);
            glue.postMessage('PARSE_TREE_DATA', data)
        }
    }
});