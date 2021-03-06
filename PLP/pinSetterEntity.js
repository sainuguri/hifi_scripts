//  PinSetterEntity.js
//  Copyright 2016 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

(function() { 
    var _this; 

    var BOWLING_ALLEY_PREFIX_URL = 'http://hifi-content.s3.amazonaws.com/caitlyn/production/bowlingAlley/';

    var IMPORT_URL_PINSET = BOWLING_ALLEY_PREFIX_URL + 'bpins4.svo.json';
    var IMPORT_URL_BALL = BOWLING_ALLEY_PREFIX_URL + 'bowlingBall.svo.json';
    var BELL_SOUND_URL = BOWLING_ALLEY_PREFIX_URL + 'bell.wav';
    var RETURN_SOUND_URL = BOWLING_ALLEY_PREFIX_URL + 'caitlynMeeks_ball%20return%20mechanism.wav';

    var SECONDS_IN_HOUR = 3600;
    var MAX_EQUIPMENT_LIFETIME = SECONDS_IN_HOUR;
    var SECOND_BALL_WAIT_MILLISECONDS = 2000;

    var TRIANGLE_NUMBER_OF_PINS = 4;
    var TRIANGLE_WIDTH = 1;

    var PIN_DIMENSIONS = {
        x: 0.1638,
        y: 0.3971,
        z: 0.1638
    };

    var BOWLING_BALLS = [
        {
            name: 'Bowling ball - Salmon',
            density: 5000,
            dimensions: {
                x: 0.245,
                y: 0.245,
                z: 0.245
            }
        },
        {
            name: 'Bowling ball - Purple',
            density: 6000,
            dimensions: {
                x: 0.265,
                y: 0.265,
                z: 0.265
            },
            textures: JSON.stringify({
                file4: BOWLING_ALLEY_PREFIX_URL + 'bowlingball_Base_Color_purple.png',
                file5: BOWLING_ALLEY_PREFIX_URL + 'ball_salmon.fbx/../../../../Downloads/bowlingball.fbm/bowlingball_Roughness.png'
            })
        },
        {
            name: 'Bowling ball - Yellow',
            density: 4000,
            dimensions: {
                x: 0.205,
                y: 0.205,
                z: 0.205
            },
            textures: JSON.stringify({
                file4: BOWLING_ALLEY_PREFIX_URL + 'bowlingball_Base_Color_yellow.png',
                file5: BOWLING_ALLEY_PREFIX_URL + 'ball_salmon.fbx/../../../../Downloads/bowlingball.fbm/bowlingball_Roughness.png'
            })
        },
        {
            name: 'Bowling ball - Blue',
            density: 5500,
            dimensions: {
                x: 0.255,
                y: 0.255,
                z: 0.255
            },
            textures: JSON.stringify({
                file4: BOWLING_ALLEY_PREFIX_URL + 'bowlingball_Base_Color_blue.png',
                file5: BOWLING_ALLEY_PREFIX_URL + 'ball_salmon.fbx/../../../../Downloads/bowlingball.fbm/bowlingball_Roughness.png'
            })
        }
    ];

    // See https://en.wikipedia.org/wiki/Triangular_number for Triangle numbers (T1 = 1, T2 = 3, T3 = 6 ... etc)
    var getPinPositions = function(maxWidth, triangleNumber) {
        var pinPositions = [];
        var gapSpace = maxWidth / triangleNumber;
        for (var row = 0; row < triangleNumber; row++) {
            var rowPins = triangleNumber - row;
            for (var rowPinIndex = 0; rowPinIndex < rowPins; rowPinIndex++) {
                pinPositions.push({
                    x: (-((rowPins - 1) / 2) + rowPinIndex) * gapSpace,
                    z: row * gapSpace
                })
            }
        }

        return pinPositions;
    };

    var returnSound, ringSound;

    // Creates an entity and returns a mixed object of the creation properties and the assigned entityID
    var createEntity = function(entityProperties, parent) {
        if (parent.rotation !== undefined) {
            if (entityProperties.rotation !== undefined) {
                entityProperties.rotation = Quat.multiply(parent.rotation, entityProperties.rotation);
            } else {
                entityProperties.rotation = parent.rotation;
            }
        }
        if (parent.position !== undefined) {
            var localPosition = (parent.rotation !== undefined) ? Vec3.multiplyQbyV(parent.rotation, entityProperties.position) : entityProperties.position;
            entityProperties.position = Vec3.sum(localPosition, parent.position);
        }
        if (parent.id !== undefined) {
            entityProperties.parentID = parent.id;
        }
        entityProperties.id = Entities.addEntity(entityProperties);
        return entityProperties;
    };

    var createPin = function (transform, extraProperties, bowlingAlley) {
        var entityProperties = {
            compoundShapeURL: BOWLING_ALLEY_PREFIX_URL + 'bowlingpin_hull.obj',
            dimensions: PIN_DIMENSIONS,
            dynamic: true,
            gravity: {
                x: 0,
                y: -9.8,
                z: 0
            },
            modelURL: BOWLING_ALLEY_PREFIX_URL + 'bowlingpin.fbx',
            name: 'Bowling Pin',
            shapeType: 'compound',
            type: 'Model',
            userData: JSON.stringify({
                isBowlingPin: true,
                bowlingAlley: bowlingAlley,
                grabbableKey: {
                    grabbable: false
                }
            }),
            script: 'http://mpassets.highfidelity.com/f01af088-7410-40e2-a331-310e9a0d068e-v1/bowlingPinEntity.js',
            lifetime: MAX_EQUIPMENT_LIFETIME
        };
        for (var key in extraProperties) {
            if (extraProperties.hasOwnProperty(key)) {
                entityProperties[key] = extraProperties[key];
            }
        }
        return createEntity(entityProperties, transform);
    };

    var createBall = function (transform, extraProperties, bowlingAlley) {
        var entityProperties = {
            angularDamping: 0.3,
            collisionsWillMove: 1,
            damping: 0.01,
            density: 5000,
            dimensions: {
                x: 0.245,
                y: 0.245,
                z: 0.245
            },
            angularVelocity: {
                w: -0.12123292684555054,
                x: 0.97888147830963135,
                y: -0.075059115886688232,
                z: -0.14644080400466919
            },
            velocity: Vec3.multiplyQbyV(transform.rotation, {
                x: 0,
                y: 0,
                z: 1,
            }),
            collidesWith: 'static,dynamic,kinematic',
            dynamic: true,
            friction: 0.1,
            gravity: {
                x: 0,
                y: -9.8,
                z: 0
            },
            modelURL: BOWLING_ALLEY_PREFIX_URL + 'ball_salmon.fbx',
            restitution: 0.2,
            rotation: {
                w: -0.12123292684555054,
                x: 0.97888147830963135,
                y: -0.075059115886688232,
                z: -0.14644080400466919
            },
            shapeType: 'sphere',
            type: 'Model',
            userData: JSON.stringify({
                isBowlingBall: true,
                bowlingAlley: bowlingAlley,
                grabbableKey: {
                    grabbable: true
                }
            }),
            script: 'http://mpassets.highfidelity.com/f01af088-7410-40e2-a331-310e9a0d068e-v1/bowlingBallEntity.js',
            lifetime: MAX_EQUIPMENT_LIFETIME
        };
        for (var key in extraProperties) {
            if (extraProperties.hasOwnProperty(key)) {
                entityProperties[key] = extraProperties[key];
            }
        }

        Audio.playSound(returnSound, {
            position: transform.position,
            volume: 0.5
        });

        return createEntity(entityProperties, transform);
    };

    function ResetButton() {
        _this = this;
    }

    ResetButton.prototype = {
        entityID: null,
        resetConsoleID: null,
        bowlingAlleyID: null,
        preload: function(entityID) { 
            print('preload(' + entityID + ')');
            _this.entityID = entityID;
            _this.resetConsoleID  = Entities.getEntityProperties(_this.entityID, ['parentID']).parentID;
            _this.bowlingAlleyID = Entities.getEntityProperties(_this.resetConsoleID, ['parentID']).parentID; // get the bowling alley's parent ID     
            ringSound = SoundCache.getSound(BELL_SOUND_URL);
            returnSound = SoundCache.getSound(RETURN_SOUND_URL);
        },
        unload: function() {
            // this would remove the pins when someone random is leaving (not what we intend)
            //    _this.clearPins();
        },
        clearPins: function() {
            Entities.findEntities(MyAvatar.position, 1000).forEach(function(entity) {
                try {
                    var userData = JSON.parse(Entities.getEntityProperties(entity, ['userData']).userData);
                    if (userData.isBowlingPin && userData.bowlingAlley === _this.bowlingAlleyID) {
                        print("Found pin, deleting it: " + entity);
                        Entities.deleteEntity(entity);
                    }
                } catch(e) {}
            }); 
        },
        createRandomBallInRetractor: function() {
            var entProperties = Entities.getEntityProperties(_this.bowlingAlleyID, ['position', 'rotation']);
            var jointIndex = Entities.getJointIndex(_this.bowlingAlleyID, 'ballLocatorJoint');
            var jointLocInObjectFrame = Entities.getAbsoluteJointTranslationInObjectFrame(_this.bowlingAlleyID, jointIndex);
            var jointLocInWorld = Vec3.sum(entProperties.position, Vec3.multiplyQbyV(entProperties.rotation, jointLocInObjectFrame));   
            createBall({
                position: jointLocInWorld,
                rotation: entProperties.rotation
            }, BOWLING_BALLS[Math.floor(BOWLING_BALLS.length * Math.random())],  _this.bowlingAlleyID);
        },
        clearBalls: function() {
            Entities.findEntities(MyAvatar.position, 1000).forEach(function(entity) {
                try {
                    var userData = JSON.parse(Entities.getEntityProperties(entity, ['userData']).userData);
                    if (userData.isBowlingBall && userData.bowlingAlley === _this.bowlingAlleyID) {
                        print("Found ball, deleting it: " + entity);
                        Entities.deleteEntity(entity);
                    }
                } catch(e) {}
            }); 
        },
        doTheRez: function() {
            //print("START BOWLING RESET TRIGGER");
            // Reset pins
            var entProperties = Entities.getEntityProperties(_this.bowlingAlleyID);
            var jointNames = Entities.getJointNames(_this.bowlingAlleyID);
            //print("Joint Names " + jointNames);
            var jointIndex = Entities.getJointIndex(_this.bowlingAlleyID, 'pinLocatorJoint');
            //print("JOINT INDEX IS " + jointIndex);
            var jointLocInObjectFrame = Entities.getAbsoluteJointTranslationInObjectFrame(_this.bowlingAlleyID, jointIndex);
            var jointLocInWorld = Vec3.sum(entProperties.position, Vec3.multiplyQbyV(entProperties.rotation, jointLocInObjectFrame));   
            //print("LOCATION IS " + JSON.stringify(jointLocInWorld));
            
            _this.clearPins();

            //print("ADDING NEW PINS");

            var pinHeightOffset = {y: PIN_DIMENSIONS.y / 2};
            getPinPositions(TRIANGLE_WIDTH, TRIANGLE_NUMBER_OF_PINS).forEach(function(pinPosition) {
                createPin({
                    position: Vec3.sum(jointLocInWorld, pinHeightOffset),
                    rotation: entProperties.rotation
                }, {
                    position: pinPosition
                }, _this.bowlingAlleyID);
            });

            //print("PINS ADDED");
            
            // Add new ball
            _this.createRandomBallInRetractor();

            Script.setTimeout(function() {
                _this.createRandomBallInRetractor();
            }, SECOND_BALL_WAIT_MILLISECONDS);

            //Clipboard.importEntities(IMPORT_URL_BALL);
            //Clipboard.pasteEntities(jointLocInWorld);
            //print("BALL ADDED");        
            
            // Completion sound
            Audio.playSound(ringSound, {
                position: Entities.getEntityProperties(_this.entityID, ['position']).position,
                volume: 0.5
            });
        },
        startNearTrigger: function(entityID) {        
            _this.doTheRez();
        },
        clickReleaseOnEntity: function(entityID, mouseEvent) {
            if (mouseEvent.isLeftButton) {
                _this.doTheRez();
            }
        }
    };
    return new ResetButton();
});
