import h from './h'
import component from './component'
import Component from './types/Component'

type FragmentProps = {
  key?: number | string,
  children?: any // TODO
}

const Fragment = component<FragmentProps>('Fragment')({
  render(props) {
    const { children, ...props2 } = props

    return h(Fragment as any, props2, ...children)
  }
}) as Component<FragmentProps>

export default Fragment
