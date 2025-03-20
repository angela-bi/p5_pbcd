function format(js: string): string {
    js = js.replace(/\s/g,'');
    let indent = 0;
    let ret = "";
    for (const c of js) {
        if (c == "(") {
            indent += 1;
            ret += "(\n" + "  ".repeat(indent);
        } else if (c == ",") {
            ret += ",\n" + "  ".repeat(indent);
        } else {
            ret += c;
        }
    }
    return ret;
}

export { format }
