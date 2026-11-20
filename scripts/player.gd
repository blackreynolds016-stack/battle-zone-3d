extends CharacterBody3D

@export var move_speed: float = 5.5
@export var jump_velocity: float = 5.0
@export var turn_speed: float = 10.0

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var touch_direction: Vector2 = Vector2.ZERO
var jump_requested: bool = false
var joystick_touch_id: int = -1
var joystick_center: Vector2
var joystick_radius: float = 70.0

@onready var camera_pivot: Node3D = $CameraPivot
@onready var joystick_base: ColorRect = $TouchControls/JoystickBase
@onready var joystick_knob: ColorRect = $TouchControls/JoystickBase/JoystickKnob
@onready var jump_button: Button = $TouchControls/JumpButton

func _ready() -> void:
    joystick_center = joystick_base.global_position + joystick_base.size * 0.5
    jump_button.button_down.connect(_request_jump)

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity.y -= gravity * delta
    elif jump_requested:
        velocity.y = jump_velocity
        jump_requested = false

    var input_dir := Vector2(
        Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
        Input.get_action_strength("move_back") - Input.get_action_strength("move_forward")
    )
    if touch_direction.length() > 0.08:
        input_dir = touch_direction

    input_dir = input_dir.normalized()
    var forward := -camera_pivot.global_basis.z
    var right := camera_pivot.global_basis.x
    var move_dir := (right * input_dir.x + forward * input_dir.y)
    move_dir.y = 0.0
    move_dir = move_dir.normalized()

    velocity.x = move_dir.x * move_speed
    velocity.z = move_dir.z * move_speed

    if move_dir.length() > 0.1:
        var target_yaw := atan2(-move_dir.x, -move_dir.z)
        rotation.y = lerp_angle(rotation.y, target_yaw, turn_speed * delta)

    move_and_slide()

func _request_jump() -> void:
    jump_requested = true

func _input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        var touch_pos := event.position
        if event.pressed and joystick_base.get_global_rect().has_point(touch_pos):
            joystick_touch_id = event.index
            _update_joystick(touch_pos)
        elif not event.pressed and event.index == joystick_touch_id:
            joystick_touch_id = -1
            touch_direction = Vector2.ZERO
            joystick_knob.position = Vector2(42, 42)
    elif event is InputEventScreenDrag and event.index == joystick_touch_id:
        _update_joystick(event.position)

func _update_joystick(screen_pos: Vector2) -> void:
    var offset := screen_pos - joystick_center
    if offset.length() > joystick_radius:
        offset = offset.normalized() * joystick_radius
    touch_direction = Vector2(offset.x, offset.y) / joystick_radius
    joystick_knob.position = Vector2(70, 70) + offset - joystick_knob.size * 0.5
