import {Effect, Effects} from '..';
import assert from 'assert';

describe('Effect', () => {

    it('create pure effects', () => {
        const perform = Effects.performer();
        const data = 5;
        const pureEffect = Effect(data);
        return perform(pureEffect).then(values =>
            assert.deepEqual(values, [5]));
    });

    it('map over pure effects', () => {
        const perform = Effects.performer();
        const pureEffect = Effect(5).
            map((v) => {
                assert.equal(v, 5);
                return 8;
            });
        return perform(pureEffect).then(values =>
            assert.deepEqual(values, [8]));
    });

    it('use effect-specific Effects.performers', () => {
        const perform = Effects.performer();
        const NOW = 5;
        const now = Effects.create('now', undefined, () => NOW);
        return perform(now).then(values => {
            assert.deepEqual(values, [NOW]);
        });
    });

    it('map over effect-specific Effects.performer', () => {
        const perform = Effects.performer();
        const NOW = 5;
        const now = Effects.create('now', undefined, () => NOW).
            map((value) => {
                assert.equal(value, 5);
                return 42;
            });
        return perform(now).then(values => {
            assert.deepEqual(values, [42]);
        });
    });

    it('map over batched effects', () => {
        const perform = Effects.performer();
        const NOW = 5;
        const counter = (i) => (value) => {
            assert.equal(value, i);
            i += 1;
            return 42;
        };
        const effect = Effects.all([
            Effect(5),
            Effect(6)
        ]).map(counter(5))
        return perform(effect).then(values => {
            assert.deepEqual(values, [42, 42]);
        });
    });

    it('map over effect-specific Effects.performer that returns array', () => {
        const perform = Effects.performer();
        const NOW = 5;
        const now = Effects.create('now', undefined, () => [NOW, NOW]).
            map((value) => {
                assert.equal(value, 5);
                return 42;
            });
        return perform(now).then(values => {
            assert.deepEqual(values, [42, 42]);
        });
    });

    it('map over effect-specific Effects.performer that returns promise of array', () => {
        const perform = Effects.performer();
        const NOW = 5;
        const now = Effects.create('now', undefined, () => Promise.resolve([NOW, NOW])).
            map((value) => {
                assert.equal(value, 5);
                return 42;
            });
        return perform(now).then(values => {
            assert.deepEqual(values, [42, 42]);
        });
    });

    it('apply many functions to many values', () => {
        const perform = Effects.performer();
        const NOW = 5;
        const functions = Effects.all([Effect((x) => x*2), Effect((x) => 42)])
        const values = Effects.all([Effect(2), Effect(3)]);
        const effect = Effects.apply(functions, values);
        return perform(effect).then(results => {
            assert.deepEqual(results, [4, 6, 42, 42]);
        });
    });

    it('apply many functions to many values using Effects.performers', () => {
        const perform = Effects.performer();
        const NOW = 5;
        const twice = (x) => x*2;
        const answer = (x) => 42;
        const functions = Effects.create('functions', [twice, answer], (fns) => Promise.resolve(fns))
        const values = Effects.create('values', [2, 3], (vs) => Promise.resolve(vs));
        const effect = Effects.apply(functions, values);
        return perform(effect).then(results => {
            assert.deepEqual(results, [4, 6, 42, 42]);
        });
    });

    it('fail when one applied to other than function', () => {
        const perform = Effects.performer();
        assert.throws(() => {
            Effect.apply(Effect(8), Effect(2));
        });
    });

    it('fail when one applied to other than function (all) ', () => {
        const perform = Effects.performer();
        assert.throws(() => {
            Effect.apply(Effects.all([Effect(8), Effect(9)]), Effect(2));
        });
    });

    it('fail when one applied to other than function (custom) ', () => {
        const perform = Effects.performer();
        const custom = Effects.create('custom', [8,9], (vs) => Promise.resolve(vs));
        const effect = Effects.apply(custom, Effect(2));
        return perform(effect).
            then((result) => {
                assert.fail(result, undefined, 'Should never reach .then');
            }).
            catch((err) => assert(err));
    });

    it('return list of promise if map returns promise', () => {
        const perform = Effects.performer();
        const effect = Effect(4).map((x) => Promise.resolve(8));
        return perform(effect).then(values => {
            assert.equal(values.length, 1);
            const [promise] = values;
            assert(promise instanceof Promise);
        });
    });

    it('fail if apply is called with anything but an Effect', () => {
        assert.throws(() => {
           const effect = Effects.apply(2, Effect(3));
        });
        assert.throws(() => {
           const effect = Effects.apply(Effect((x) => x*2), 3);
        });
    });

    it('compose', () => {
        const perform = Effects.performer();
        const effect = Effects.compose(Effect((x => x*2)), Effect(2));
        return perform(effect).then(values => {
            assert.deepEqual(values, [4]);
        });
    });

    it('compose twice', () => {
        const perform = Effects.performer();
        const effect = Effects.compose(Effect((y) => y + 3), Effect((x => x*2)), Effect(2));
        return perform(effect).then(values => {
            assert.deepEqual(values, [7]);
        });
    });

    it('compose with custom effects', () => {
        const perform = Effects.performer();
        const twice = Effects.create('twice', (x) => x*2, (fn) => Promise.resolve(fn));
        const effect = Effects.compose(twice, Effect(2));
        return perform(effect).then(values => {
            assert.deepEqual(values, [4]);
        });
    });

    it('compose to compose', () => {
        const perform = Effects.performer();
        const twice = Effects.create('twice', (x) => x*2, (fn) => Promise.resolve(fn));
        const effect = Effects.compose(Effect(y => y + 3), Effects.compose(twice, Effect(2)));
        return perform(effect).then(values => {
            assert.deepEqual(values, [7]);
        });
    });

    it('compose with custom effects twice', () => {
        const perform = Effects.performer();
        const twice = Effects.create('twice', (x) => x*2, (fn) => Promise.resolve(fn));
        const addThree = Effects.create('three', (x) => x+3, (fn) => Promise.resolve(fn));
        const effect = Effects.compose(addThree, twice, Effect(2));
        return perform(effect).then(values => {
            assert.deepEqual(values, [7]);
        });
    });

    it('sequence with custom effects twice', () => {
        const perform = Effects.performer();
        const twice = Effects.create('twice', (x) => x*2, (fn) => Promise.resolve(fn));
        const addThree = Effects.create('three', (x) => x+3, (fn) => Promise.resolve(fn));
        const effect = Effects.sequence(Effect(2), twice, addThree);
        return perform(effect).then(values => {
            assert.deepEqual(values, [7]);
        });
    });

    it('all with one element', () => {
        const perform = Effects.performer();
        const effect = Effects.all([Effect(2)]);
        return perform(effect).then(values => {
            assert.deepEqual(values, [2]);
        });
    });

    it('all with two elements', () => {
        const perform = Effects.performer();
        const effect = Effects.all([Effect(2), Effect(3)]);
        return perform(effect).then(values => {
            assert.deepEqual(values, [2, 3]);
        });
    });
});

