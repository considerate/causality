import {Cause, Causes} from '..';
import assert from 'assert';

describe('Cause', () => {

    it('create pure causes', () => {
        const perform = Causes.performer();
        const data = 5;
        const pureCause = Cause(data);
        return perform(pureCause).then(values =>
            assert.deepEqual(values, [5]));
    });

    it('map over pure causes', () => {
        const perform = Causes.performer();
        const pureCause = Cause(5).
            map((v) => {
                assert.equal(v, 5);
                return 8;
            });
        return perform(pureCause).then(values =>
            assert.deepEqual(values, [8]));
    });

    it('use cause-specific Causes.performers', () => {
        const perform = Causes.performer();
        const NOW = 5;
        const now = Causes.create('now', undefined, () => NOW);
        return perform(now).then(values => {
            assert.deepEqual(values, [NOW]);
        });
    });

    it('map over cause-specific Causes.performer', () => {
        const perform = Causes.performer();
        const NOW = 5;
        const now = Causes.create('now', undefined, () => NOW).
            map((value) => {
                assert.equal(value, 5);
                return 42;
            });
        return perform(now).then(values => {
            assert.deepEqual(values, [42]);
        });
    });

    it('map over batched causes', () => {
        const perform = Causes.performer();
        const NOW = 5;
        const counter = (i) => (value) => {
            assert.equal(value, i);
            i += 1;
            return 42;
        };
        const cause = Causes.all([
            Cause(5),
            Cause(6)
        ]).map(counter(5))
        return perform(cause).then(values => {
            assert.deepEqual(values, [42, 42]);
        });
    });

    it('map over cause-specific Causes.performer that returns array', () => {
        const perform = Causes.performer();
        const NOW = 5;
        const now = Causes.create('now', undefined, () => [NOW, NOW]).
            map((value) => {
                assert.equal(value, 5);
                return 42;
            });
        return perform(now).then(values => {
            assert.deepEqual(values, [42, 42]);
        });
    });

    it('map over cause-specific Causes.performer that returns promise of array', () => {
        const perform = Causes.performer();
        const NOW = 5;
        const now = Causes.create('now', undefined, () => Promise.resolve([NOW, NOW])).
            map((value) => {
                assert.equal(value, 5);
                return 42;
            });
        return perform(now).then(values => {
            assert.deepEqual(values, [42, 42]);
        });
    });

    it('apply many functions to many values', () => {
        const perform = Causes.performer();
        const NOW = 5;
        const functions = Causes.all([Cause((x) => x*2), Cause((x) => 42)])
        const values = Causes.all([Cause(2), Cause(3)]);
        const cause = Causes.apply(functions, values);
        return perform(cause).then(results => {
            assert.deepEqual(results, [4, 6, 42, 42]);
        });
    });

    it('apply many functions to many values using Causes.performers', () => {
        const perform = Causes.performer();
        const NOW = 5;
        const twice = (x) => x*2;
        const answer = (x) => 42;
        const functions = Causes.create('functions', [twice, answer], (fns) => Promise.resolve(fns))
        const values = Causes.create('values', [2, 3], (vs) => Promise.resolve(vs));
        const cause = Causes.apply(functions, values);
        return perform(cause).then(results => {
            assert.deepEqual(results, [4, 6, 42, 42]);
        });
    });

    it('fail when one applied to other than function', () => {
        const perform = Causes.performer();
        assert.throws(() => {
            Cause.apply(Cause(8), Cause(2));
        });
    });

    it('fail when one applied to other than function (all) ', () => {
        const perform = Causes.performer();
        assert.throws(() => {
            Cause.apply(Causes.all([Cause(8), Cause(9)]), Cause(2));
        });
    });

    it('fail when one applied to other than function (custom) ', () => {
        const perform = Causes.performer();
        const custom = Causes.create('custom', [8,9], (vs) => Promise.resolve(vs));
        const cause = Causes.apply(custom, Cause(2));
        return perform(cause).
            then((result) => {
                assert.fail(result, undefined, 'Should never reach .then');
            }).
            catch((err) => assert(err));
    });

    it('return list of promise if map returns promise', () => {
        const perform = Causes.performer();
        const cause = Cause(4).map((x) => Promise.resolve(8));
        return perform(cause).then(values => {
            assert.equal(values.length, 1);
            const [promise] = values;
            assert(promise instanceof Promise);
        });
    });

    it('fail if apply is called with anything but an Cause', () => {
        assert.throws(() => {
           const cause = Causes.apply(2, Cause(3));
        });
        assert.throws(() => {
           const cause = Causes.apply(Cause((x) => x*2), 3);
        });
    });

    it('compose', () => {
        const perform = Causes.performer();
        const cause = Causes.compose(Cause((x => x*2)), Cause(2));
        return perform(cause).then(values => {
            assert.deepEqual(values, [4]);
        });
    });

    it('compose twice', () => {
        const perform = Causes.performer();
        const cause = Causes.compose(Cause((y) => y + 3), Cause((x => x*2)), Cause(2));
        return perform(cause).then(values => {
            assert.deepEqual(values, [7]);
        });
    });

    it('compose with custom causes', () => {
        const perform = Causes.performer();
        const twice = Causes.create('twice', (x) => x*2, (fn) => Promise.resolve(fn));
        const cause = Causes.compose(twice, Cause(2));
        return perform(cause).then(values => {
            assert.deepEqual(values, [4]);
        });
    });

    it('compose to compose', () => {
        const perform = Causes.performer();
        const twice = Causes.create('twice', (x) => x*2, (fn) => Promise.resolve(fn));
        const bottom = Causes.compose(twice, Cause(2));
        const cause = Causes.compose(Cause(y => y + 3), bottom);
        return perform(cause).then(values => {
            assert.deepEqual(values, [7]);
        });
    });


    it('none applied to something returns none', () => {
        const perform = Causes.performer();
        const cause = Causes.apply(Causes.none, Cause(2));
        return perform(cause).then((values) => {
            assert.deepEqual(values, []);
        });
    });

    it('something applied to none returns none', () => {
        const perform = Causes.performer();
        const cause = Causes.apply(Cause((x) => 2), Causes.none);
        return perform(cause).then((values) => {
            assert.deepEqual(values, []);
        });
    });

    it('compose with custom causes twice', () => {
        const perform = Causes.performer();
        const twice = Causes.create('twice', (x) => x*2, (fn) => Promise.resolve(fn));
        const addThree = Causes.create('three', (x) => x+3, (fn) => Promise.resolve(fn));
        const cause = Causes.compose(addThree, twice, Cause(2));
        return perform(cause).then(values => {
            assert.deepEqual(values, [7]);
        });
    });

    it('sequence with custom causes twice', () => {
        const perform = Causes.performer();
        const twice = Causes.create('twice', (x) => x*2, (fn) => Promise.resolve(fn));
        const addThree = Causes.create('three', (x) => x+3, (fn) => Promise.resolve(fn));
        const cause = Causes.sequence(Cause(2), twice, addThree);
        return perform(cause).then(values => {
            assert.deepEqual(values, [7]);
        });
    });

    it('all with one element', () => {
        const perform = Causes.performer();
        const cause = Causes.all([Cause(2)]);
        return perform(cause).then(values => {
            assert.deepEqual(values, [2]);
        });
    });

    it('all with two elements', () => {
        const perform = Causes.performer();
        const cause = Causes.all([Cause(2), Cause(3)]);
        return perform(cause).then(values => {
            assert.deepEqual(values, [2, 3]);
        });
    });

    it.skip('optimizes pure cause with custom cause in the middle', () => {
        const perform = Causes.performer();
        const custom = Causes.create('custom', undefined, () => (x) => x);
        const cause = Causes.compose(Cause((x) => x * 2), custom, Cause(2));
        assert.equal(cause.type, 'apply');
        const {f, x} = cause.data;
        assert.equal(f.type, 'pure');
        // console.log(cause);
        assert.equal(x.type, 'custom');
        return perform(cause).then((values) => {
            assert.deepEqual(values, [4]);
        })
    });
});

