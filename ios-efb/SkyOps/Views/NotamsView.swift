import SwiftUI
import Combine

/// Displays NOTAMs with airport and type filtering.
struct NotamsView: View {
    @StateObject private var viewModel = NotamsViewModel()

    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading NOTAMs…")
                } else if viewModel.filtered.isEmpty {
                    emptyState
                } else {
                    notamList
                }
            }
            .navigationTitle("NOTAMs")
            .searchable(text: $viewModel.searchText, prompt: "ICAO, keyword…")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    filterMenu
                }
            }
            .task { await viewModel.load() }
            .refreshable { await viewModel.load() }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") {}
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }

    // MARK: - Sub-views

    private var notamList: some View {
        List(viewModel.filtered) { notam in
            NavigationLink(destination: NotamDetailView(notam: notam)) {
                NotamRowView(notam: notam)
            }
            .swipeActions {
                Button(notam.isRead ? "Unread" : "Read") {
                    viewModel.toggleRead(notam)
                }
                .tint(notam.isRead ? .gray : .blue)
            }
        }
        .listStyle(.insetGrouped)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            Text("No NOTAMs found")
                .font(.title3)
                .foregroundColor(.secondary)
        }
    }

    private var filterMenu: some View {
        Menu {
            Section("Type") {
                ForEach(NotamsViewModel.TypeFilter.allCases, id: \.self) { f in
                    Button(action: { viewModel.typeFilter = f }) {
                        Label(
                            f.displayName,
                            systemImage: viewModel.typeFilter == f ? "checkmark" : ""
                        )
                    }
                }
            }
            Section("Status") {
                Toggle("Active only", isOn: $viewModel.activeOnly)
            }
        } label: {
            Image(systemName: "line.3.horizontal.decrease.circle")
        }
    }
}

// MARK: - NotamRowView

struct NotamRowView: View {
    let notam: Notam

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: notam.type.sfSymbol)
                .foregroundColor(notam.isRead ? .secondary : .orange)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(notam.notamNumber)
                        .font(.headline)
                        .fontWeight(notam.isRead ? .regular : .bold)
                    Spacer()
                    Text(notam.icao)
                        .font(.caption.monospaced())
                        .foregroundColor(.skyBlue)
                }
                Text(notam.text)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                HStack {
                    if notam.isPermanent {
                        Label("PERM", systemImage: "infinity")
                            .font(.caption2)
                            .foregroundColor(.red)
                    } else if let end = notam.endDate {
                        Label(end.formatted(date: .abbreviated, time: .shortened),
                              systemImage: "calendar")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding(.vertical, 4)
        .opacity(notam.isRead ? 0.6 : 1.0)
    }
}

// MARK: - Notam Detail

struct NotamDetailView: View {
    let notam: Notam

    var body: some View {
        List {
            Section("Summary") {
                LabeledContent("Number", value: notam.notamNumber)
                LabeledContent("Airport", value: notam.icao)
                LabeledContent("Type", value: notam.type.rawValue.capitalized)
            }
            Section("Effective") {
                LabeledContent("From", value: notam.startDate.formatted())
                if let end = notam.endDate {
                    LabeledContent("Until", value: end.formatted())
                } else {
                    LabeledContent("Until", value: "PERMANENT")
                }
                LabeledContent("Active", value: notam.isActive ? "Yes" : "No")
            }
            Section("Text") {
                Text(notam.text)
                    .font(.body)
            }
            Section("Raw") {
                Text(notam.rawText)
                    .font(.system(.caption, design: .monospaced))
                    .textSelection(.enabled)
            }
        }
        .navigationTitle(notam.notamNumber)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - ViewModel

@MainActor
final class NotamsViewModel: ObservableObject {
    enum TypeFilter: CaseIterable {
        case all, aerodrome, enRoute, warning, airspace

        var displayName: String {
            switch self {
            case .all:       return "All Types"
            case .aerodrome: return "Aerodrome"
            case .enRoute:   return "En Route"
            case .warning:   return "Warning"
            case .airspace:  return "Airspace"
            }
        }
    }

    @Published var notams: [Notam] = []
    @Published var searchText: String = ""
    @Published var typeFilter: TypeFilter = .all
    @Published var activeOnly: Bool = false
    @Published var isLoading = false
    @Published var showError = false
    @Published var errorMessage = ""

    var filtered: [Notam] {
        notams
            .filter { n in
                switch typeFilter {
                case .all:       return true
                case .aerodrome: return n.type == .aerodrome
                case .enRoute:   return n.type == .enRoute
                case .warning:   return n.type == .warning
                case .airspace:  return n.type == .airspace
                }
            }
            .filter { n in activeOnly ? n.isActive : true }
            .filter { n in
                guard !searchText.isEmpty else { return true }
                let q = searchText.lowercased()
                return n.icao.lowercased().contains(q)
                    || n.text.lowercased().contains(q)
                    || n.notamNumber.lowercased().contains(q)
            }
    }

    func load() async {
        isLoading = true
        do {
            // Fetch NOTAMs from the API service (stubbed here).
            notams = try await APIService.shared.fetch([Notam].self, from: "/notams")
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }

    func toggleRead(_ notam: Notam) {
        if let idx = notams.firstIndex(where: { $0.id == notam.id }) {
            notams[idx].isRead.toggle()
        }
    }
}

#Preview {
    NotamsView()
}
