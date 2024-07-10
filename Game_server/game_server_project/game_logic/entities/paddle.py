from entities.position import Position
from game_defaults import *

# Paddle class
# Represents a paddle in the game world
# Properties:
#    - position: the position of the paddle
#    - width: the width of the paddle (read only)
#    - depth: the depth of the paddle (read only)
class Paddle:
    def __init__(self, x_position: float):
        self._position: Position = Position(x_position, 0, PLAYER_START_Z)
        self._width: float = PADDLE_WIDTH
        self._depth: float = PADDLE_DEPTH
    
    # getter for position
    @property
    def position(self) -> Position:
        return self._position
    
    # getter for x
    @property
    def x(self) -> float:
        return self._position.x
    
    # getter for z
    @property
    def z(self):
        return self._position.z
    
    # getter for width
    @property
    def width(self) -> float:
        return self._width

    # getter for depth
    @property
    def depth(self) -> float:
        return self._depth

    # move method
    # moves the paddle by the given delta z
    def move(self, delta_z: float) -> None:
        ## TODO: make sure paddle doesn't move out of bounds
        self.position.move(0, 0, delta_z)
