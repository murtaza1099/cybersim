export const PROP_POSITIONS = {
  phone: {
    position: [-0.75, 0.78, -0.25] as [number, number, number],
    rotation: [-1.57, 6.28, 0]     as [number, number, number],
    scale: 1.15,
  },
  telephone: {
    position: [-0.15, 0.90,  1.90] as [number, number, number],
    rotation: [0, 3.80, 0]         as [number, number, number],
    scale: 0.35,
  },
  usb: {
    position: [ 1.20, 1.13,  4.35] as [number, number, number],
    rotation: [0, 4.70, 0]         as [number, number, number],
    scale: 0.10,
  },
  whiteboard: {
    position: [ 4.09, 1.75, -0.10] as [number, number, number],
    rotation: [0, 4.75, 0]         as [number, number, number],
    scale: 1.75,
  },
  box: {
    position: [ 0.80, 0.00,  0.50] as [number, number, number],
    rotation: [0, 0.00, 0]         as [number, number, number],
    scale: 1.00,
  },
  holder: {
    position: [ 0.23, 0.53, -0.15] as [number, number, number],
    rotation: [0, 4.15, 0]         as [number, number, number],
    scale: 0.50,
  },
} as const
