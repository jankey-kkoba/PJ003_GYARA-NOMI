/**
 * Radix UI Toastのラッパー
 * ライブラリの直接参照を避け、後で代替しやすくする
 */
export {
  Provider as ToastProvider,
  Root as ToastRoot,
  Title as ToastTitle,
  Description as ToastDescription,
  Action as ToastAction,
  Close as ToastClose,
  Viewport as ToastViewport,
} from '@radix-ui/react-toast'
