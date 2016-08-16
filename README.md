# Causality
![Build Status](https://travis-ci.org/considerate/causality.svg?branch=master)

Declarative and testable side-effects in JavaScript.

## What's a Cause?

A cause is an object that describes how one or more side effects
should be performed. It is important to note that a Cause in itself
should be free from side-effects. It is only when the Cause is evaluated
by the `causality` runtime that side-effects may occur.

## Why would you need such an object?

By wrapping side-effects in declarative objects you increase the amount
of code that may be tested in unit tests. Causes are designed in such
a way as to allow for easy creation of mocks. The base Causes as included
in this library are side-effect free and custom Cause performers created
by `Causes.create()` are not run by default leaving you to replace custom
performers by your own test-specific performers.

