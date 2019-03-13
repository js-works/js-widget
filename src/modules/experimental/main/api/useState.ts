import Component from './types/Component'

export default function useState<T>(c: Component, initialValue: T): [() => T, (updater: T | ((value: T) => T)) => void] {
   return c.handleState(initialValue)
}
