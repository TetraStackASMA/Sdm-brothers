const fs = require('fs');
const p = require('./tmp_prod.js'); 
const categories = [...new Set(p.map(x=>x.category))]; 

let md = '# Complete Product List (' + p.length + ' Products)\n\n';
md += 'This list is automatically generated from the website\'s frontend database (`products.js`).\n\n'; 

categories.forEach(C => { 
    md += '## ' + C + '\n'; 
    const prods = p.filter(x => x.category === C); 
    prods.forEach(x => { 
        let desc = x.description || '';
        if (desc.length > 80) desc = desc.substring(0, 80) + '...';
        md += '- **' + x.name + '** (₹' + x.price + ') - *' + desc + '*\n'; 
    }); 
    md += '\n'; 
}); 

fs.writeFileSync('C:\\Users\\Aarin\\.gemini\\antigravity\\brain\\bd5527b8-d999-458b-8b43-309260dcc4ef\\product_list.md', md);
console.log('Done!');
