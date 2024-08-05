import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import fontJson from 'three/examples/fonts/droid/droid_sans_regular.typeface.json'; // Adjust path if necessary
import { degreesToRads } from '../utils.js';
import { vertexShader } from '../shaders/vertexShader.js';
import { scoreBoardShader} from '../shaders/scoreBoardShader.js';
import { WIDTH, HEIGHT } from '../constants.js';
import { convertToRange } from '../utils.js';
import { globalState } from '../globalState.js';

class ScoreBoard {
    constructor(scene) {
        this.scene = scene;
        this.scoreMesh = null;
        this.font = new FontLoader().parse(fontJson);
    }

    createText(text, size, color = 0xFFFFFF, base, speed) {
        const geometry = new TextGeometry(text, {
            font: this.font,
            size: size,
            depth: 4,
            curveSegments: 12,
        });
        globalState.scoreBoardMaterial = new THREE.ShaderMaterial({ 
            vertexShader: vertexShader,
            fragmentShader: scoreBoardShader,
            transparent: true,
            depthWrite: false,
            uniforms: {
                color: { value: new THREE.Color(color) },
                iTime: { value: globalState.iTime },
                base: { value: base },
                speed: { value: speed }
                // iResolution: { value: new THREE.Vector2(WIDTH, HEIGHT) },
 
            }
        });
        const mesh = new THREE.Mesh(geometry, globalState.scoreBoardMaterial);

        // Compute the bounding box of the geometry
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;

        // Calculate the center of the bounding box
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);

        // Reposition the geometry so that its center is at the origin
        geometry.translate(-center.x, -center.y, -center.z);

        // Set the mesh position to the desired position
        mesh.position.set(0, 90.0, 300.0);

        // Rotate the mesh 180 degrees (PI radians) around the Y-axis if invertedView is true
        if (globalState.invertedView === true) {
            mesh.rotation.y = THREE.MathUtils.degToRad(180);
        } else {
            mesh.position.z = -300.0;
        }
        return mesh;
    }

    createScoreBoard(text) {
        this.scoreMesh = this.createText(text, 50, 0xFF0000, 1.0, 2.);
        this.scene.add(this.scoreMesh);
    }

    updateScores(player1Score, player2Score) {
        this.clearScores();
        const text = `Player 1: ${player1Score}\nPlayer 2: ${player2Score}`;
        this.createScoreBoard(text);
    }

    showGoalText() {
        this.clearScores();
        console.log("nyt pitäs näyttää maaliteksti")
        this.scoreMesh = this.createText('GOAL', 50, 0xFFFF00, 0.3, 9.);
        this.scene.add(this.scoreMesh);
    }

    clearScores() {
        if (this.scoreMesh) {
            this.scene.remove(this.scoreMesh);
            this.scoreMesh.geometry.dispose();
            this.scoreMesh.material.dispose();
            this.scoreMesh = null;
        }
    }

}

export default ScoreBoard;
