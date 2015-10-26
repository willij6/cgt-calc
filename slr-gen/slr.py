# rules will be an array of arrays,
# 0th entry is the non-terminal

class whatever:
    def __init__(self,rules):
        self.rules = rules
        self.symbols = set()
        self.nonterminals = set()
        for i in rules:
            self.nonterminals.add(i[0])
            for j in i:
                self.symbols.add(j)
        self.symbols = list(self.symbols)
        self.terminals = [s for s in self.symbols if s not in self.nonterminals]

        self.firsts = {}
        for i in self.symbols:
            if(i in self.terminals):
                self.firsts[i] = {i}
            else:
                self.firsts[i] = set()
        while(self.closeFirsts()):
            pass

        self.follows = {}
        for i in self.symbols:
            self.follows[i] = set()
        ess = self.rules[0][0]
        self.follows[ess].add('$')
        while(self.closeFollows()):
            pass

        # TODO: follow

        t = self.rules[0]
        t = list(t)
        t.insert(1,'*')
        t = tuple(t)
        start = {t}
        self.close(start)
        start = frozenset(start)
        
        self.states = [start]
        i = 0
        while(i < len(self.states)):
            current = self.states[i]
            for s in self.symbols:
                nex = self.advance(current,s)
                if(nex and nex not in self.states):
                    self.states.append(nex)
            i+=1

        self.build_table()


    def advance(self, item, symbol):
        core = set()
        for x in item:
            j = x.index('*') + 1;
            if(j < len(x) and x[j] == symbol):
                x = list(x);
                (x[j],x[j-1]) = (x[j-1],x[j])
                core.add(tuple(x))
        if(len(core) == 0):
            return False
        self.close(core)
        return frozenset(core)

    def one_upgrade(self, item):
        for rule in item:
            if('*' not in rule):
                print("Hey ! " + str(item))
            j = rule.index('*') + 1
            if(j < len(rule)):
                symbol = rule[j]
                for k in self.rules:
                    if(k[0] == symbol):
                        to_add = [symbol] + ['*'] + list(k[1:])
                        to_add = tuple(to_add)
                        if(to_add not in item):
                            # print("About to add " + str(to_add))
                            # print("To " + str(item))
                            # input("Okay? ")
                            item.add(to_add)
                            return True
        return False

    def close(self, item):
        while(self.one_upgrade(item)):
            # print(len(item))
            pass

    def format(self,rule):
        s = rule[0]
        s += "->"
        for t in rule[1:]:
            s += t
        return s

    def pretty_print(self):
        print("There are %d states" % len(self.states))
        for i in range(len(self.states)):
            print("STATE %d" % i)
            s = self.states[i]
            for rule in s:
                if(rule[-1] == '*'):
                    nont = rule[0]
                    string = ""
                    for follow in self.follows[nont]:
                        string += (follow + " ")
                    print("\tOn " + string + "do " + self.format(rule))
                    print()
            for sym in self.symbols:
                nex = self.advance(s,sym)
                if(nex):
                    j = self.states.index(nex)
                    print("\tOn %s GOTO state %d" % (sym,j))

    # stop after one step and return True
    # if you get to the end without doing any, return False
    # 
    # not efficient, but it works
    def closeFirsts(self):
        for r in self.rules:
            start = r[0]
            i = 1
            while(True):
                if(i >= len(r)):
                    sym = ""
                    if(sym in self.firsts[start]):
                        break
                    else:
                        self.firsts[start].add(sym)
                        return True
                nex = r[i]
                for sym in self.firsts[nex]:
                    if(sym == ""):
                        continue
                    if(sym not in self.firsts[start]):
                        self.firsts[start].add(sym)
                        return True
                if "" in self.firsts[nex]:
                    i+=1
                else:
                    break
        return False

    # stop after one step and return True
    # if you get to the end without doing anything, return False
    #
    # not efficient, but it works
    def closeFollows(self):
        for r in self.rules:
            nont = r[0]
            for i in range(1,len(r)):
                cur = r[i]
                j = i+1
                while(True):
                    if(j >= len(r)):
                        # add all of self.follows(nont)
                        # to self.follows(cur)
                        for sym in self.follows[nont]:
                            if(sym not in self.follows[cur]):
                                self.follows[cur].add(sym)
                                return True
                        break
                    nex = r[j]
                    for sym in self.firsts[nex]:
                        if sym == "":
                            continue
                        if(sym not in self.follows[cur]):
                            self.follows[cur].add(sym)
                            return True
                    if "" in self.firsts[nex]:
                        j += 1
                    else:
                        break
        return False


    def build_table(self):
        self.table = []
        for s in self.states:
            row = {}
            for rule in s:
                if(rule[-1] == '*'):
                    true_rule = list(rule[:-1])
                    rule_index = self.rules.index(true_rule)
                    nont = rule[0]
                    for sym in self.follows[nont]:
                        if(sym in row):
                            print("Oh no reduce/reduce conflict!")
                        row[sym] = ('reduce',rule_index)
            for sym in self.symbols:
                t = self.advance(s,sym)
                if(t):
                    i = self.states.index(t)
                    if(sym in row):
                        print("Oh no shift/reduce conflict!")
                    row[sym] = ('shift',i)
            self.table.append(row)

    def parse(self,sequence,silent=True):
        start = self.rules[0][0] # the initial symbol
        where = 0
        def pull():
            nonlocal where
            retval = peek()
            where += 1
            return retval
            
        def peek():
            return sequence[where] if where < len(sequence) else '$'

        parse_stack = [0]


        while(True):
            if(not silent):
                print(parse_stack)
            current_state = parse_stack[-1]
            row = self.table[current_state]
            nex = peek()
            if(nex not in row):
                print("Parse error alpha! %s" % nex)
                return
            (typ,action) = row[nex]
            if(typ == 'shift'):
                pull()
                parse_stack.append((nex,nex))
                parse_stack.append(action)
            else:
                rul = self.rules[action]
                nont = rul[0]
                to_collapse = len(rul) - 1
                semantics = []
                for i in range(-to_collapse,0):
                    if(2*i < -len(parse_stack)):
                        print("Parse error beta!")
                        return
                    (typ,sem) = parse_stack[2*i]
                    if(typ != rul[i]):
                        print("Parse error gamma!")
                        return
                    semantics.append(sem)
                sem = self.semantics(action,semantics)
                if(nont == start):
                    return sem
                if(to_collapse > 0):
                    parse_stack = parse_stack[:(-2*to_collapse)]
                revealed = parse_stack[-1]
                row2 = self.table[revealed]
                if(nont not in row2):
                    print("Parse error delta!")
                    return
                (blah1,blah2) = row2[nont]
                if(blah1 != 'shift'):
                    print("Parse error epsilon!")
                    return
                parse_stack.append((nont,sem))
                parse_stack.append(blah2)
                    
                
    def semantics(self,rule_index,contents):
        # return contents
        if(rule_index == 0):
            return contents[0]
        if(rule_index == 1):
            return contents[0] + ' < ' + contents[2]
        if(rule_index == 2):
            return contents[0] + ' becomes ' + contents[2]
        if(rule_index == 3):
            return contents[0]
        if(rule_index == 4): # E E + T
            return contents[0] + ' + ' + contents[2]
        if(rule_index == 5): # T ( E )
            return contents[1]
        if(rule_index == 6): # T { barl }
            return '{ ' + contents[1] + ' }'
        if(rule_index == 7): # T + T
            return "-(" + contents[1] + ")"
        if(rule_index == 8): # T x
            return "literal"
        if(rule_index == 9): # barl commal0
            return contents[0]
        if(rule_index == 10): # barl barl | commal0
            return contents[0] + " | " + contents[2]
        if(rule_index == 11): # commal0 nought
            return ""
        if(rule_index == 12): # commal0 commal
            return contents[0]
        if(rule_index == 13): # commal E
            return contents[0]
        if(rule_index == 14): # commal commal , E
            return contents[0] + ", " + contents[2]
        return "oops"
                        
t = whatever([str.split(x,' ') for x in str.split(
'''S C
C E
C E comp E
E T
E E + T
T ( E )
T { barl }
T + T
T x
barl commal0
barl barl | commal0
commal0
commal0 commal
commal E
commal commal , E''','\n')])
t.pretty_print()
# print(t.parse(str.split('x := x + { | + x , x + x }',' ')))
print()

syms = list(t.symbols)
for s in syms:
    print("\t" + s, end="")
print()
for i in range(len(t.states)):
    print("S %d" % i, end="")
    row = t.table[i]
    for s in syms:
        if(s in row):
            (ty,ac) = row[s]
            if(ty == 'reduce'):
                print("\tr" + str(ac),end="")
            elif ty == 'shift':
                print("\t" + str(ac),end="")
            else:
                print("\t WTF",end="")
        else:
            print("\t",end="")
    print("\t!!")

        

# preferably as a json
# oh and also tell whether there's an unresolvable conflict

