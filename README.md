# cgt-calc, v0
This is a tool for performing calculations in combinatorial game
theory.  It is written in JavaScript as a client-side web application.
Some version is posted
[on my website](https://math.berkeley.edu/~willij/calc/calculator.html)
The current version is extremely preliminary.

## Usage
Currently, the tool reads in expressions from the user and evaluates
them.  Variables can be assigned by writing things like

    >> x = {0| }
    >> y = {0|}-{1|x}

Currently, the calculator only knows about 0, 1, and a few
other games, so you must manually
add things like *3, 5, and so on:

    >> *3 = {0,*,*2|0,*,*2}
    >> 5 = 2+3
    >> doubleup = {0|*} + {0|*}

Values are output in canonical form.  When possible, the output is
described using values that have been named:

    >> 1+1
    {1|}
    >> 2 = 1+1
    2 = {1|}
    >> 1+1
    2
    
To get the canonical form of a named variable, you can enter its name

    >> 2
    {1|}

To compare two games, separate them with ?

    >> * = {0|0}
    >> up = {0|*}
    >> 1 ? up
    1 > up
    >> up ? *
    up || *

The following special syntaxes are supported:

* `{A,B,C}` for impartial games.  For instance,

        >> star = {0}
        >> *2 = {0,star}
        >> *3 = {0,star,*2}
        >> pm1 = {1,-1}

* Syntax like `{1||2|3}` for {1|{2|3}}.

Bug: when unknown variables are used inside an expression,
they are interpreted as zero:

    >> {asdf|}
    {0|}

## Features
Currently, the only things implemented are a parser, and a very basic
engine for manipulating partizan games, supporting the following
operations:

* Building games out of their options (the {|} operator).
* Adding, subtracting, and negating games.
* Comparing games
* Finding the canonical form.

## Future goals
On the level of a basic calculator, I would like to add additional
operations, such as heating and cooling, mean values, atomic weights,
Norton multiplication, left and right sides, and Conway multiplication for
numbers and nimbers.

I would also like to have something a bit more interactive, like Sage,
rather than the terminal emulator that I currently have.

In the long run, I would like to use HTML5 canvases to allow the user
to edit positions in Domineering and other such games, calculating
values on the fly.

Internally, the basic algorithms need to be improved.  Addition and
subtraction aren't memoized.  The parser is done with recursive
descent, which works well enough, but is difficult to alter.

## Background on CGT
Combinatorial game theory is the study of two player games of perfect
information, without chance.  Central to the subject is Conway,
Guy, and Berlekamp's theory of partizan games, detailed in their books
_On Numbers and Games_ and _Winning Ways_.

In this theory, one assumes the "normal play rule": __the loser is the
first player unable to move on his/her turn__.  Games like
[Nim](https://en.wikipedia.org/wiki/Nim),
[Amazons](https://en.wikipedia.org/wiki/Game_of_the_Amazons), and
[Domineering](https://en.wikipedia.org/wiki/Domineering) work this
way.  Unfortunately, more common games like Chess and Checkers fall
outside the scope of the theory.

A quick summary of the theory:

1. The two players are named Left and Right, for typographical reasons.
2. There is a partially ordered abelian group of "values".
3. Each position in each game is assigned a value from this group.
4. The outcome of a position under perfect play is determined by
comparing the value of the game to 0.
  * A position *P* is a win for Left,
with Left to move, if and only if *P* &#8816; 0.
  * A position *P* is a win for Right,
with Right to move, if and only if *P* &#8817; 0.
5. When two positions *P* and *Q* are played "in parallel," the value
of the combined position is *P*+*Q*.
  * This makes the theory particularly useful when positions naturally
    break into pieces.
6. When the roles of Left and Right are reversed, the value of a position
is negated.
7. Two positions are "equivalent" if they have the same value.
8. Each value is represented by a canonical position of minimal complexity,
   called the "canonical form" of the game.
9. If *A*, *B*, *C* and *D* are positions, then {*A*, *B*|*C*, *D*}
denotes a position where Left can move to *A* and *B*, and Right can
move to *C* and *D*.




