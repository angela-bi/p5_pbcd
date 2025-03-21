//list of all patches to apply to an expression
import { NodePath } from "@babel/traverse"
import * as t from "@babel/types";
import * as parser from "@babel/parser";
import generate, { GeneratorResult } from "@babel/generator";
export function literalInsertions(path: NodePath<t.Node>): (t.Expression | t.Identifier | t.NumericLiteral)[] {

    //Numbers
    const numbers = [10, 100]

    //Variables In Scope
    const bindings: t.Identifier[] = []
    Object.keys(path.scope.bindings).forEach(key => {
        const identifier = path.scope.bindings[key].identifier
        identifier.extra = { "id": crypto.randomUUID() }
        bindings.push(identifier)
    })

    //Special Variables
    const special_list = ["mouseX", "mouseY", "frameCount % 300"]
    const specials = special_list.map((special) => {
        const special_node = (parser.parse(special).program.body[0] as t.ExpressionStatement).expression
        special_node.extra = { "id": crypto.randomUUID() }
        // console.log("Node Type", special_node.type)
        return special_node
    })

    return [...numbers.map(n => t.numericLiteral(n)), ...bindings, ...specials]
}

function sinusoids() {
    const expressions: string[] = ["sin", "cos", "tan"]
    const patches = expressions.map((expr) => {
        const expressionPatch = (path: NodePath): [NodePath | undefined, string?] => {
            if (path.isExpression() || path.isLiteral()) {
                const newExpression = t.callExpression(t.identifier(expr), [path.node])
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


function binaryExpressions(literals: (t.Identifier | t.NumericLiteral | t.Expression)[]) {
    const expressions: ("*" | "+" | "-" | "/" | "%" | "**")[] = ["*", "+", "-", "/", "%", "**"]
    const patches = expressions.map((expr) => {
        const expressionPatch = (path: NodePath): [NodePath | undefined, string?] => {
            if (path.isExpression() || path.isLiteral()) {
                const newExpression = t.binaryExpression(expr, path.node, literals[Math.floor(Math.random() * literals.length)])
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


