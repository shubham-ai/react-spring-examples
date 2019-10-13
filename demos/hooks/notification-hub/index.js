import React, { useRef, useState, useEffect } from 'react'
import lorem from 'lorem-ipsum'
import { X } from 'react-feather'
import { useTransition } from 'react-spring'
import { Main, Container, Message, Button, Content, Life } from './styles.js'

const DEBUG = false

let id = 0

function MessageHub({
  config = { tension: 125, friction: 20, precision: 0.1 },
  timeout = 3000,
  children,
}) {
  const [refMap] = useState(() => new WeakMap())
  const [cancelMap] = useState(() => new WeakMap())
  const [items, setItems] = useState([])

  const transition = useTransition(items, {
    key: item => item.key,
    from: { opacity: 0, height: 0, life: '100%' },
    enter: item => async (next, stop) => {
      if (DEBUG) console.log(`  Entering:`, item.key)
      cancelMap.set(item, () => {
        if (DEBUG) console.log(`  Cancelled:`, item.key)
        stop()
        setItems(state => state.filter(i => i.key !== item.key))
      })
      await next({
        opacity: 1,
        height: refMap.get(item).offsetHeight,
        config,
      })
      await next({ life: '0%', config: { duration: timeout } })
      cancelMap.get(item)()
    },
    leave: item => async next => {
      if (DEBUG) console.log(`  Leaving:`, item.key)
      await next({ opacity: 0, config })
      await next({ height: 0, config })
    },
  })

  useEffect(
    () =>
      void children(msg => setItems(state => [...state, { key: id++, msg }])),
    []
  )

  return (
    <Container>
      {transition(({ life, ...style }, item) => (
        <Message style={style}>
          <Content ref={ref => ref && refMap.set(item, ref)}>
            <Life style={{ right: life }} />
            <p>{item.msg}</p>
            <Button
              onClick={e => {
                e.stopPropagation()
                if (cancelMap.has(item)) {
                  if (DEBUG) console.log(`  Cancelled item:`, item)
                  cancelMap.get(item)()
                }
              }}>
              <X size={18} />
            </Button>
          </Content>
        </Message>
      ))}
    </Container>
  )
}

export default function App() {
  const ref = useRef(null)
  return (
    <Main onClick={() => ref.current(lorem())}>
      Click here
      <br />
      to create notifications
      <MessageHub children={add => (ref.current = add)} />
    </Main>
  )
}