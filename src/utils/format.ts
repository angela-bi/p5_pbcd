import beautify from 'js-beautify';
function format(js: string): string {

    return beautify.js(js, {
        "wrap_line_length": 15, "indent_size": 2

    })

    // js = js.replace(/\s/g, '');

    // if (js.length <= 10) {
    //     return js;
    // }

    // let indent = 0;
    // let ret = "";
    // for (let i = 0; i < js.length; i++) {
    //     const c = js.at(i)
    //     if (c === "(" && js.slice(i).indexOf(")") > 5 && i > 0 && js.at(i - 1) !== " ") {

    //         indent += 1;
    //         ret += "(\n" + "  ".repeat(indent);
    //     } else if (c === ",") {
    //         ret += ",\n" + "  ".repeat(indent);
    //     } else {
    //         ret += c;
    //     }
    // }
    // return ret;
}

export { format }
