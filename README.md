### Install
```npm install```

### Run
* ```npm run dev```
* Go to `localhost:8080` in the web browser

### Environment
The provided ```index.ts``` script loads a simple Babylon.js scene and adds three primitive objects: Cylinder, Cube, IcoSphere.

*I'm more familiar with Three.JS but it worth while researching about Babylon.JS. While my experience in Babylon.js are not much, I've been developing in WebGL for 3 years and I find some of the aspect are conceptually similar and was able to adapt my previous knowledge from Three.JS into Babylon.JS*

#### Task 1) UI & Primitive Meshes
Selecting a mesh should bring up a UI window with primitives parameters adjustment. 
You can choose any library or plain HTML to implement the following UI
When a primitive mesh is selected, the UI should display options specific for the selected primitive. It should be possible to set:
* For the *Cube*: 3 dimensions: width, height, depth (range 0.1-2.0)
* For the *Cylinder*: Diameter and height (range 0.1-2.0)
* For the *IcoSphere*: Diameter (range 0.1-2.0) and subdivisions (range 1-10)

#### Solution Task 1) UI & Primitive Meshes
I could create a new set of HTML UI with API and controller to handle elements change,
But I find it redundant, so I decided to use the lil-GUI library to create a simple UI with controller and APIs ready to use.
In previous projects, I ussually spent time on custom made GUI but due to the nature of the assessment, I decided not to and use a library instead.

#### Task 2) Bouncing Animation
Implement the following algorithm:
`applyBouncing(node: TransformNode, amplitude: number, duration: time)`

where
* `node` - an object which should play this animation
* `amplitude` - the start height of the bounce.
* `"duration` - Period of time in ms from the start of the animation when the object is at the topmost point to the end of the animation when the object has completely stopped. E.g. if duration is 2 seconds the whole animation should finish in 2 seconds i.e. it will be twice as fast vs if duration is 4 seconds. But the overall animation is the same.

The result of this animation should roughly match the following video:(https://www.youtube.com/watch?v=a7oSbf8NiLw)

Please implement this on a mesh in the scene e.g. a sphere, so that the animation can be viewed