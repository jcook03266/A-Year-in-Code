//
//  SafariView.swift
//  Foncii
//
//  Created by Justin Cook on 2/10/23.
//

import SwiftUI
import SafariServices

/// Safari View Controller wrapped in a SwiftUI View
struct SafariView: UIViewControllerRepresentable {
    let url: URL
    
    func makeUIViewController(context: UIViewControllerRepresentableContext<SafariView>) -> SFSafariViewController {
        return SFSafariViewController(url: url)
    }
    
    func updateUIViewController(_ uiViewController: SFSafariViewController, context: UIViewControllerRepresentableContext<SafariView>) {
        
    }
}
