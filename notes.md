## 9/20/24
thoughts
- design principle - something that results in a visual output - filter out commands that don't result in a change instead of explicitly defining
- text function as a commit, tree as exploration = lower barrier to output
- finer granularity aka changing one parameter, involving data mining/processing that presents options based on past inputs
- quickpose-type previews of output at each branch

todo
- fork p5 repo and explore how onHover functionality might work
- sketch lofi proposals of seperated vs. quickpose type interface

## 9/13/24
todo
- create tests
- create script to run checks
- show output in different situations
- make a sample slide for basic p5 program
- apple program - list of valid commands at each line with arrow for insert direction

## 8/8/24
- later: support defining property valid: [ConstructorNames, fill] array with multiple types
```
// scratch work
    // if (validCommand.kind == "ClosingModifier") {
    //     return null // change this to if hoverCommand is a valid "body" command and valid parentheses
    // }
    // if (validCommand.kind == "Modifier") {
    //     if (isOnValidList || validCommand.default_valid) { return "Above" } // both modifiers and constructors can be default true or false
    //     return "Below" // there are edge cases where constructor can go below modifier
    // }
    // if (isOnInvalidList || !validCommand.default_valid) {
    //     return null // invalid
    // } 
    // return null
```