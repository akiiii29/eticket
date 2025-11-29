import React from "react";

interface CreateTicketFormProps {
    name: string;
    setName: (name: string) => void;
    quantity: string;
    setQuantity: (quantity: string) => void;
    quantityNumber: number;
    loading: boolean;
    handleCreateTicket: (e: React.FormEvent) => void;
    error: string;
}

export default function CreateTicketForm({
    name,
    setName,
    quantity,
    setQuantity,
    quantityNumber,
    loading,
    handleCreateTicket,
    error,
}: CreateTicketFormProps) {
    return (
        <div className="card p-10 mb-12">
            <h2
                className="text-2xl mb-6"
                style={{
                    fontFamily: "Playfair Display, Georgia, serif",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                }}
            >
                Tạo Vé Mới
            </h2>
            <form onSubmit={handleCreateTicket}>
                <div className="flex flex-col gap-4 mb-4 lg:flex-row">
                    <div className="flex-1">
                        <label
                            className="block mb-2"
                            style={{
                                fontSize: "0.8125rem",
                                fontWeight: 500,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                color: "var(--text-secondary)",
                            }}
                        >
                            Tên Khách
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập tên khách"
                            required
                            className="input-minimal w-full"
                        />
                    </div>
                    <div className="w-full md:w-52">
                        <label
                            className="block mb-2"
                            style={{
                                fontSize: "0.8125rem",
                                fontWeight: 500,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                color: "var(--text-secondary)",
                            }}
                        >
                            Số Lượng Vé
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                                const val = e.target.value;
                                // Allow only digits (empty string is OK so user can clear)
                                if (/^\d*$/.test(val)) {
                                    setQuantity(val);
                                }
                            }}
                            onKeyDown={(e) => {
                                // Block non-numeric special keys like e, +, -, .
                                if (["e", "E", "+", "-", "."].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            min="0"
                            max="100"
                            required
                            className="input-minimal w-full"
                        />
                    </div>
                    <div className="flex items-end w-full lg:w-auto">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full md:w-auto"
                        >
                            {loading
                                ? "Đang tạo..."
                                : quantityNumber >= 1
                                    ? `Tạo ${quantityNumber} Vé`
                                    : "Tạo Vé"}
                        </button>
                    </div>
                </div>
            </form>
            {error && (
                <div
                    className="card p-4"
                    style={{
                        background: "rgba(168, 87, 81, 0.05)",
                        borderColor: "var(--accent-red)",
                        marginTop: "1rem",
                    }}
                >
                    <p style={{ color: "var(--accent-red)", fontSize: "0.875rem" }}>
                        {error}
                    </p>
                </div>
            )}
        </div>
    );
}
