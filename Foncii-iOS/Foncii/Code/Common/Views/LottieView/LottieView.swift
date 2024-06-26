//
// LottieView.swift
// Foncii
//
// Created by Justin Cook on 5/20/23 at 5:56 PM
// Copyright © 2023 Foodie Inc. All rights reserved.
//

import SwiftUI
import Lottie

/// Simple SwiftUI  usable and fully controllable Lottie Animation View
struct LottieViewUIViewRepresentable: UIViewRepresentable {
    let animationName: LottieAnimationRepository
    var animationView = LottieAnimationView(),
        loopMode: LottieLoopMode = .loop
    
    @Binding var shouldPlay: Bool
    
    func makeUIView(context: UIViewRepresentableContext<LottieViewUIViewRepresentable>) -> LottieView {
        return LottieView(animationName: animationName,
                          loopMode: loopMode,
                          playState: shouldPlay)
    }
    
    func updateUIView(_ uiView: LottieView, context: UIViewRepresentableContext<LottieViewUIViewRepresentable>) {
        uiView.playState = shouldPlay
    }
}

/// UView that encloses a lottie animation view, used for bridging to SwiftUI
class LottieView: UIView {
    var animationView: LottieAnimationView = LottieAnimationView(),
        loopMode: LottieLoopMode
    
        private var playing: Bool = false
        var playState: Bool {
            get{
              return playing
            }
            set{
                playing = newValue
                updatePlayState()
            }
        }
    
    let animationName: LottieAnimationRepository
    var animation: LottieAnimation {
        /// Expensive operation, init only once
        return LottieAnimations.getAnimation(named: animationName)
    }
    
    init(animationName: LottieAnimationRepository,
         loopMode: LottieLoopMode = .loop,
         playState: Bool = false)
    {
        self.animationName = animationName
        self.loopMode = loopMode
        
        super.init(frame: .zero)
     
        animationView.animation = animation
        animationView.contentMode = .scaleAspectFit
        animationView.backgroundBehavior = .pauseAndRestore
        animationView.shouldRasterizeWhenIdle = true
        animationView.loopMode = loopMode
        
        self.playState = playState
        
        // Add subview and activate layout constraints
        animationView.translatesAutoresizingMaskIntoConstraints = false
        self.addSubview(animationView)
        
        NSLayoutConstraint.activate([
            animationView.heightAnchor.constraint(equalTo: self.heightAnchor),
             animationView.widthAnchor.constraint(equalTo: self.widthAnchor)
            ])
    }
    
    required init?(coder: NSCoder) {
        ErrorCodeDispatcher.SwiftErrors.triggerFatalError(for: .inheritedCoderNotImplemented)()
    }
    
    // MARK: - Animations Controls
    func updatePlayState() {
        playState ? play() : pause()
    }
    
    func play() {
        animationView.play()
    }
    
    func pause() {
        animationView.pause()
    }
    
    func stop() {
        animationView.stop()
    }
}
