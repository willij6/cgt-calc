# let's try it again using recursive descent instead
#
# then translate into javascript




seq = str.split('x + { | + x , x + x }', ' ')

where = 0

def peek():
    if(where == len(seq)):
        return '$'
    return seq[where]

def pull():
    global where
    retval = peek()
    where += 1
    return retval

def expect(tok):
    assert(peek() == tok)
    if(pull() != tok):
        print("Error: expected " + tok)



def read_term():
    c = peek()
    if(c == '+'):
        pull()
        return ['unary plus', read_term()]
    if(c == '('):
        pull()
        x = read_expression()
        expect(')')
        return x
    if(c == 'x'):
        pull()
        return c
    if(c == '{'):
        pull()
        bl = read_bl()
        expect('}')
        return bl
    print("Oh no! Unexpected " + c)
    return None

def read_expression():
    retval = ['expression']
    retval.append(read_term())
    while(peek() == '+'):
        retval.append(pull())
        retval.append(read_term())
    return retval

def read_bl():
    retval = ['bl']
    while(peek() != '}'):
        retval.append(read_commal())
        if(peek() == '}'):
            return retval
        expect('|')
    return retval

def read_commal():
    retval = ['cl']
    if(peek() == '|' or peek() == '}'):
        return retval
    while(True):
        retval.append(read_expression())
        if(peek() == '|' or peek() == '}'):
            return retval
        expect(',')


def read_command():
    e1 = read_expression()
    if(peek() == '$'):
        return ['eval', e1]
    c = peek()
    if(c != '=' and c != '<'):
        print("Error: unexpected " + c)
    e2 = read_expression()
    expect('$')
    return ['compare', e1, c, e2]




        
