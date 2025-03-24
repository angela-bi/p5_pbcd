//list of all patches to apply to an expression
import { Binding, NodePath } from "@babel/traverse"
import * as t from "@babel/types";
import * as parser from "@babel/parser";
import generate, { GeneratorResult } from "@babel/generator";

function findVariablesInScope(path: NodePath) {
    const bindings: Binding[] = []


    //For the current scope, we want just the variables that have been defined before our current line
    Object.keys(path.scope.bindings).forEach((key) => {
        const variable = path.scope.bindings[key]

        if (path.node.loc?.start.line && variable.identifier.loc?.end.line && variable.identifier.loc?.end.line < path.node.loc?.start.line) {
            if (bindings.find(x => x.identifier.name === variable.identifier.name) === undefined) {
                bindings.push(variable)
            }
        }
    })
    if (path.scope.getBlockParent()) {
        // console.log("block parent", path.scope.getBlockParent())
        const blockBindings = Object.values(path.scope.getBlockParent().getAllBindings())
        // console.log("block bindings", blockBindings)
        blockBindings.forEach(variable => {
            // console.log(path.node.loc?.start.line, variable.identifier.loc?.end.line)

            if (path.node.loc?.start.line && variable.identifier.loc?.end.line && variable.identifier.loc?.end.line < path.node.loc?.start.line) {
                // console.log("add Variable", variable)
                if (bindings.find(x => x.identifier.name === variable.identifier.name) === undefined) {
                    bindings.push(variable)
                }
            }
        })
        // bindings.push()
        //   let current_path = { ...path.parentPath } //make sure it copies by value, not reference
        //   while (current_path.parentPath !== null) {
        //     current_path.scope.getAllBindings()
        //     current_path = current_path.parentPath
        //   }
    }
    //TODO: Not searching API Calls correctly
    const return_bindings = bindings.filter(variable => variable.kind === "let" || variable.kind === "var" || variable.kind === "const")
    // console.log("found variables", return_bindings.map(x => x.identifier.name))
    return return_bindings
}

export function literalInsertions(path: NodePath<t.Node>, newCall?: boolean, decimal?: boolean): (t.Expression | t.Identifier | t.NumericLiteral)[] {

    //Numbers
    const numbers = [10, 100]

    //Variables In Scope
    const bindings = findVariablesInScope(path)

    const bindingNodes: t.Identifier[] = []
    bindings.forEach(binding => {
        const identifier = t.identifier(binding.identifier.name)
        identifier.extra = { "id": crypto.randomUUID() }
        bindingNodes.push(identifier)
    })

    //Special Variables
    const special_list = ["mouseX", "frameCount % 200", "frameCount % 100",]
    const specials = special_list.map((special) => {
        const special_node = (parser.parse(special).program.body[0] as t.ExpressionStatement).expression
        special_node.extra = { "id": crypto.randomUUID() }
        // console.log("Node Type", special_node.type)
        return special_node
    })
    let numbersNodes: (t.NumericLiteral | t.DecimalLiteral)[] = []
    if (bindingNodes.length < 2 || newCall) {
        numbersNodes = numbers.map(n => decimal ? t.numericLiteral((n / 100.0)) : t.numericLiteral(n))
    }

    if (decimal) {
        const insertions = [...numbersNodes, ...bindingNodes, ...specials]
        return insertions.map(x => t.callExpression(t.identifier("log"), [x]))
    } else {
        return [...numbersNodes, ...bindingNodes, ...specials]
    }
}

function sinusoids() {
    const expressions: string[] = ["sin", "cos", "tan", "noise", "random"]
    const patches = expressions.map((expr) => {
        const expressionPatch = (path: NodePath, literal?: t.Identifier | t.NumericLiteral | t.Expression): [NodePath | undefined, string?] => {
            if (path.isExpression() && (!path.isLiteral())) {
                const newExpression = t.callExpression(t.identifier(expr), [path.node])
                // console.log("sinusoid PREgenerate", path, expr, newExpression)
                path.replaceWith(newExpression)
                // console.log("sinusoid generate", path, generate(newExpression).code)
                return [path, generate(newExpression).code]
            }
            // console.log("rejected", path)
            return [undefined]
        }
        return expressionPatch
    })
    return patches
}


function binaryExpressions(literals: (t.Identifier | t.NumericLiteral | t.Expression)[]) {
    const expressions: ("*" | "+" | "-" | "/" | "%")[] = ["*", "+", "-", "/", "%"]
    const patches = expressions.map((expr) => {
        const expressionPatch = (path: NodePath, literal?: t.Identifier | t.NumericLiteral | t.Expression): [NodePath | undefined, string?] => {
            if (path.isExpression() || path.isLiteral()) {
                const newExpression = t.binaryExpression(expr, path.node, literal ? literal : literals[Math.floor(Math.random() * literals.length)])
                path.replaceWith(newExpression)
                return [path, generate(newExpression).code]
            }
            // console.log("rejected", path)
            return [undefined]
        }
        return expressionPatch
    })
    return patches
}

export function generateMutations(path: NodePath<t.Node>) {
    const insertionLiterals = literalInsertions(path)
    return [...binaryExpressions(insertionLiterals), ...sinusoids()]
}


