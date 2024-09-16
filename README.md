# Overview/Goal
The goal of this repo is to outline basic logic that might be needed when considering which commands to provide to a user when they hover over a given command in `p5.js`.
A sample interaction could be: 
- A user hovers over the `circle` function in p5. 
- A popup menu provides the options to add a `circle` call below or a `fill` call above the hovered function.
In this example, `circle` is our `hoverCommand`. In our backend, we will have a list of commands, each of which will be considered as a `validCommand` -- whether or not to suggest it as a valid command, and which direction to insert it. 

For now, each command, including `hoverCommand`s and `validCommand`s have the following structure:
```
type Command = {
    name: CommandName
	valid: CommandName[]
	invalid: CommandName[]
	default_valid: Boolean
    kind: "Modifier" | "Constructor" | "ClosingModifier"
    direction: InsertDirection | null 
}
```
- `default_valid` is relevant for `validCommand`s. It is true (by default it is a valid command) or false (by default it is *not* a valid command).
- `valid` is relevant for `validCommand`s where `default_valid` is `false`.
- `invalid` is relevant for `validCommand`s where `default_valid` is `true`.
- `direction` is "Above", "Below" or null. We return null when there is no valid direction that validCommand can be inserted in, or when  commands are not relevant to consider as validCommands e.g. when deciding if beginShape is a valid command; we assume that the user has used beginShape and endShape in proper pairs. Essentially, null = "it doesn't make sense to offer this validCommand as an option to the user"

# Requirements
- Make sure Typescript is installed by running `tsc -v` in your terminal.

# To run
- In `src` run `tsc logic.ts --watch` - This will make all saved changes compiled automatically into js.
- Then, in `tests` run `npm test` - This will run `logic.test.ts` which uses jest to check all unit tests.