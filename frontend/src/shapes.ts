export interface ShapeRectangle {
    type: 'rectangle';
    width: number;
    height: number;
}

export interface ShapeCircle {
    type: 'circle';
    radius: number;
}

export type Shape = ShapeRectangle | ShapeCircle;

export const shapeDimensions = (shape: Shape) => {
    switch (shape.type) {
        case 'rectangle':
            return { width: shape.width, height: shape.height };
        case 'circle':
            return { width: shape.radius * 2, height: shape.radius * 2 };
    }
};
