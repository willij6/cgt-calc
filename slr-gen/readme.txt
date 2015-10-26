I thought of using an SLR parser to parse expressions in my
combinatorial game theory calculator.  To review parsers,
I wrote my own SLR parser generator in Python.
(If I was already going to go through all the work of relearning
 the details of parsers, it felt easier to write my own than to
 also learn how to use yacc.)

But... turns out that LR parser tables are enormous, and LL or
recursive descent was more practical.  I ended up writing
a recursive descent parser in python, which I'm much more familiar
with than JavaScript.  Then I translated it into JavaScript.

For the sake of making changes to the syntax in the future, I might
salvage this code to build an LL parser generator.
