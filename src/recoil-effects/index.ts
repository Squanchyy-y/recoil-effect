/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import * as _r from "recoil";

/**
 * Implementation of lifecycle methods for Recoil atoms
 * Recoil atoms are augmented with mount/unmount functions.
 * Additionally, via AtomSubscriber, we globally track how many subscribers (a.k.a how many usages)
 * of specific atom/selector are there.
 * Every time a client tries to use an atom/selector:
 *  - If client uses selector, atom dependencies of the selector are tracked
 *  - If someone is already using an atom (subscriber count is > 0), only subscriber counter is incremented
 *  - If there are no subscribers to atom, mount() function is called
 * Every time a client stops using an atom/selector (when component using an atom/selector unmounts):
 * - If client was the only subscriber to atom/selector, unmount() function is called after 2 second timeout
 * - If subscriber count was > 0 after the client unsubscribed, subscriber counter decrements
 * Associated issue: https://github.com/facebookexperimental/Recoil/issues/586
 */

/** 
  Interface for storing functions that are called when
  atom is mounted and unmounted, count of how many times the atom is mounted,
  id of a timer that defines delay before unmount function is called

  Note: delay before calling unmount is useful, when atom unmounts and, then,
  immediately mounts (for example, when current component using the atom unmounts
  and new one, using same atom, mounts).
*/
interface AtomSubscriber {
  mount: Function;
  unmount: Function;
  count: number;
  timerId?: NodeJS.Timeout;
}

/**
 * START
 * delete when types would be fixed in recoil 0.0.11 or stable version of effects will be rolled out
 * */
interface AtomEffectsOptions<T> {
  node: _r.RecoilState<T>;
  trigger: "set" | "get";
  setSelf: _r.SetterOrUpdater<T>;
  resetSelf: () => void;
  onSet: (fn: (newValue: T, oldValue: T) => void) => void;
}
/* END */

/* Extends Recoil AtomOptions interface to add mount and unmount functions */
interface EffectsAtomOptions<T> extends _r.AtomOptions<T> {
  mount: (updater: _r.SetterOrUpdater<T>) => void;
  unmount?: (updater: _r.SetterOrUpdater<T>) => void;
  effects?: Array<(options: AtomEffectsOptions<T>) => void>;
}

/* Maps atom key to AtomSubscriber */
const subscribersAtoms = new Map<string, AtomSubscriber>();

/* Maps selector key to keys of all atoms/selectors it depends on */
const subscribersSelectors = new Map<string, Set<string>>();

/**
  Looks up AtomSubscriber by atom key and checks if given atom is already mounted 
  If not, check if there is ongoing timer and clears the timer, otherwise, calls mount()
*/
const handleMountAtom = (key: string): boolean => {
  const subscriber = subscribersAtoms.get(key);

  if (subscriber) {
    if (subscriber.count === 0) {
      if (subscriber.timerId) {
        clearTimeout(subscriber.timerId);
        subscriber.timerId = undefined;
      } else {
        subscriber.mount();
      }
    }
    subscriber.count += 1;
  }

  return !!subscriber;
};

/**
  Looks up AtomSubscriber by atom key and and decrements subsciber count for an atom. 
  If, after decrementing, atom has no subscribers, calls unmount() after 2 second timeout.
  The timeout is necessary to avoid calling mount() and, then, unmount() 
  when component A using atom is unmounted, and component B also using the atom is mounted immediately after.
*/
const handleUnmountAtom = (key: string): boolean => {
  const subscriber = subscribersAtoms.get(key);

  if (subscriber) {
    if (subscriber.count > 0) {
      subscriber.count -= 1;
    }
    if (subscriber.count === 0) {
      subscriber.timerId = setTimeout(() => {
        subscriber.unmount();
        subscriber.timerId = undefined;
      }, 2000);
    }
  }

  return !!subscriber;
};

/**
 * Looks up keys of dependencides for selector and, for each of those dependencies (atoms or selectors),
 * calls mount() or unmount() function depending on @type parameter
 */
const handleSelector = (
  key: string,
  type: `mount` | `unmount` = `mount`
): boolean => {
  const dependencies = subscribersSelectors.get(key);

  if (dependencies) {
    dependencies.forEach((dependencyKey) => {
      /* if key has dependencies, it's key of a selector - recursively handle dependencies of nested selector */
      if (subscribersSelectors.get(dependencyKey)) {
        handleSelector(dependencyKey, type);
      } else {
        (type === `mount` ? handleMountAtom : handleUnmountAtom)(dependencyKey);
      }
    });
  }

  return !!dependencies;
};

/**
 * START
 * delete when types would be fixed in recoil 0.0.11 or stable version of effects will be rolled out
 * */
type Atom = <T>(
  options: _r.AtomOptions<T> & {
    effects_UNSTABLE: Array<(options: AtomEffectsOptions<T>) => void>;
  }
) => _r.RecoilState<T>;

/* END */

/**
 * Wrapper over Recoil atom that allows, in addition to default atom options,
 * to pass mount and unmount functions. Mount and unmount functions are given setSelf parameter
 * and stored in newly created AtomSubscriber.
 */
export const effectsAtom = <T>({
  mount,
  unmount,
  effects = [],
  ...options
}: EffectsAtomOptions<T>) => {
  return (_r.atom as Atom)<T>({
    ...options,
    // eslint-disable-next-line @typescript-eslint/camelcase
    effects_UNSTABLE: [
      ({ setSelf }) => {
        subscribersAtoms.set(options.key, {
          mount: () => mount(setSelf),
          unmount: () => unmount?.(setSelf),
          count: 0,
        });
      },
      ...effects,
    ],
  });
};

/**
 Wrapper over Recoil selector that overrides default 'get' function
 used to retrieve value of other atoms/selectors. Overriden function
 stores keys of selector dependencies (other atoms or selectors) in subscribersSelectors list.

 Documentation: https://recoiljs.org/docs/api-reference/core/selector
 */
export function effectsSelector<T>(
  options: _r.ReadWriteSelectorOptions<T>
): _r.RecoilState<T>;
export function effectsSelector<T>(
  options: _r.ReadOnlySelectorOptions<T>
): _r.RecoilValueReadOnly<T>;

export function effectsSelector<T>({
  get,
  ...selectorOptions
}: _r.ReadOnlySelectorOptions<T> | _r.ReadWriteSelectorOptions<T>) {
  return _r.selector<T>({
    ...selectorOptions,
    get: (options) =>
      get({
        // recoilState is atom or selector the current selector depends on
        get: (recoilState) => {
          const dependencies = subscribersSelectors.get(selectorOptions.key);

          if (dependencies) {
            dependencies.add(recoilState.key);
          } else
            subscribersSelectors.set(
              selectorOptions.key,
              new Set([recoilState.key])
            );

          return options.get(recoilState);
        },
      }),
  });
}

/**
 * Hook that calls mount for a given atom/selector after component is mounted
 * and unmount just before component unmounting
 */
const useRecoilEffects = (key: string) => {
  React.useEffect(() => {
    // if atom with @key is not found, try to find selector
    if (!handleMountAtom(key)) {
      if (handleSelector(key)) {
        return () => {
          handleSelector(key, `unmount`);
        };
      }
    } else {
      return () => {
        handleUnmountAtom(key);
      };
    }

    return undefined;
  }, []);
};

/**
 * Wrapper over useRecoilState that calls lifecycle methods
 */
export const useRecoilEffectsState = <T>(
  state: _r.RecoilState<T>
): [T, _r.SetterOrUpdater<T>] => {
  const stateArray = _r.useRecoilState(state);
  useRecoilEffects(state.key);
  return stateArray;
};

/**
 * Wrapper over useRecoilEffectValue that calls lifecycle methods
 */
export const useRecoilEffectsValue = <T>(
  state: _r.RecoilState<T> | _r.RecoilValueReadOnly<T>
): T => {
  const value = _r.useRecoilValue(state);
  useRecoilEffects(state.key);
  return value;
};
