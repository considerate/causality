action : INCREMENT_AFTER_DELAY (1000)

state' : state

effect : Then(
  Then(
    All(
      [
        Call(incLater,2000),
        Call(incLater,1000)
      ]
    ),
    fun
  ),
  fun
)


perform(effect) = Promise [Action(Inrement), Action(Increment)]



main : (state, action) -> (state', effect)
