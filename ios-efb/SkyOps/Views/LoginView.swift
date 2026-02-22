import SwiftUI
import Combine

/// Login screen for SkyOps EFB.
struct LoginView: View {
    @EnvironmentObject var authService: AuthService

    @State private var username: String = ""
    @State private var password: String = ""
    @State private var showPassword = false
    @FocusState private var focusedField: Field?

    private enum Field { case username, password }

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color(hex: "#0D1B2A"), Color(hex: "#1B3A5C")],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    logoSection
                    credentialForm
                    loginButton
                    if let error = authService.loginError {
                        errorBanner(error)
                    }
                }
                .padding(.horizontal, 32)
                .padding(.top, 80)
            }
        }
    }

    // MARK: - Sub-views

    private var logoSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "airplane.circle.fill")
                .font(.system(size: 72))
                .foregroundColor(.white)
            Text("SkyOps EFB")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundColor(.white)
            Text("Aviation Flight Operations")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.7))
        }
    }

    private var credentialForm: some View {
        VStack(spacing: 16) {
            // Username
            HStack {
                Image(systemName: "person.fill")
                    .foregroundColor(.white.opacity(0.6))
                    .frame(width: 24)
                TextField("Username", text: $username)
                    .foregroundColor(.white)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                    .focused($focusedField, equals: .username)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .password }
            }
            .padding()
            .background(Color.white.opacity(0.1))
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.2)))

            // Password
            HStack {
                Image(systemName: "lock.fill")
                    .foregroundColor(.white.opacity(0.6))
                    .frame(width: 24)
                Group {
                    if showPassword {
                        TextField("Password", text: $password)
                    } else {
                        SecureField("Password", text: $password)
                    }
                }
                .foregroundColor(.white)
                .focused($focusedField, equals: .password)
                .submitLabel(.go)
                .onSubmit { attemptLogin() }

                Button(action: { showPassword.toggle() }) {
                    Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                        .foregroundColor(.white.opacity(0.6))
                }
            }
            .padding()
            .background(Color.white.opacity(0.1))
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.2)))
        }
    }

    private var loginButton: some View {
        Button(action: attemptLogin) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.skyBlue)
                if authService.isLoggingIn {
                    ProgressView().tint(.white)
                } else {
                    Text("Sign In")
                        .font(.headline)
                        .foregroundColor(.white)
                }
            }
            .frame(height: 52)
        }
        .disabled(username.isEmpty || password.isEmpty || authService.isLoggingIn)
        .opacity(username.isEmpty || password.isEmpty ? 0.6 : 1.0)
    }

    private func errorBanner(_ message: String) -> some View {
        HStack {
            Image(systemName: "exclamationmark.circle.fill")
            Text(message)
                .font(.subheadline)
        }
        .foregroundColor(.white)
        .padding()
        .background(Color.red.opacity(0.8))
        .cornerRadius(10)
    }

    // MARK: - Actions

    private func attemptLogin() {
        focusedField = nil
        Task {
            await authService.login(username: username, password: password)
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthService.shared)
}
