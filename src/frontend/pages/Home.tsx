import React, { useCallback, useEffect, useState } from "react";
import type { PlatformResponse } from "../../backend/controllers/PlatformController";
import { Button } from "../components/ui/button";
import { DeleteConfirmationModal } from "../components/ui/delete-confirmation-modal";
import { FormModal } from "../components/ui/form-modal";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { apiClient } from "../services/api";

export const Home: React.FC = () => {
	const [platforms, setPlatforms] = useState<PlatformResponse[]>([]);
	const [fetchers, setFetchers] = useState<string[]>([]);

	// Estados para o modal de exclusão
	const [deleteModal, setDeleteModal] = useState({
		isOpen: false,
		platformToDelete: null as PlatformResponse | null,
		isLoading: false,
	});

	// Estados para o modal de formulário
	const [formModal, setFormModal] = useState({
		isOpen: false,
		isEditing: false,
		platformToEdit: null as PlatformResponse | null,
		isLoading: false,
	});

	// Função para buscar todas as plataformas
	const getPlatforms = useCallback(async () => {
		try {
			const res = await apiClient.api.platform.platforms.get();
			const data = res.data;
			if (!data) return;
			const platforms = data.map((platform) => ({
				_id: platform._id,
				name: platform.name,
				url: platform.url,
				type: platform.type,
			}));
			setPlatforms(platforms);
		} catch (error) {
			console.error(error);
		}
	}, []);

	// Função para buscar todos os fetchers
	const getFetchers = useCallback(async () => {
		const res = await apiClient.api.platform.fetchers.get();
		const data = res.data;
		if (!data) return;
		setFetchers(data);
	}, []);

	// Funções para modal de exclusão
	const openDeleteModal = (platform: PlatformResponse) => {
		setDeleteModal({
			isOpen: true,
			platformToDelete: platform,
			isLoading: false,
		});
	};

	const closeDeleteModal = () => {
		setDeleteModal({
			isOpen: false,
			platformToDelete: null,
			isLoading: false,
		});
	};

	const handleDelete = async () => {
		if (!deleteModal.platformToDelete) return;

		setDeleteModal((prev) => ({ ...prev, isLoading: true }));

		try {
			await apiClient.api.platform
				.platforms({
					id: deleteModal.platformToDelete?._id,
				})
				.delete();
			setPlatforms((prev) =>
				prev.filter(
					(platform) => platform._id !== deleteModal.platformToDelete?._id,
				),
			);
		} catch (error) {
			console.error(error);
		} finally {
			closeDeleteModal();
		}
	};

	// Funções para modal de formulário
	const openCreateModal = () => {
		setFormModal({
			isOpen: true,
			isEditing: false,
			platformToEdit: null,
			isLoading: false,
		});
	};

	const openEditModal = (platform: PlatformResponse) => {
		setFormModal({
			isOpen: true,
			isEditing: true,
			platformToEdit: platform,
			isLoading: false,
		});
	};

	const closeFormModal = () => {
		setFormModal({
			isOpen: false,
			isEditing: false,
			platformToEdit: null,
			isLoading: false,
		});
	};

	const handleFormSubmit = async (formData: FormData) => {
		setFormModal((prev) => ({ ...prev, isLoading: true }));

		const name = formData.get("name") as string;
		const url = formData.get("url") as string;
		const type = formData.get("type") as string;

		if (formModal.isEditing && formModal.platformToEdit) {
			await apiClient.api.platform
				.platforms({
					id: formModal.platformToEdit?._id,
				})
				.post({
					name,
					url,
					type,
				});
			// Editar plataforma existente
			setPlatforms((prev) =>
				prev.map((platform) =>
					platform._id === formModal.platformToEdit?._id
						? { ...platform, name, url, type }
						: platform,
				),
			);
		} else {
			// Criar nova plataforma
			await apiClient.api.platform.platforms.post({
				name,
				url,
				type,
			});
			getPlatforms();
		}

		closeFormModal();
	};

	const handleLogout = async () => {
		await apiClient.api.auth.logout.post();
		window.location.href = "/login";
	};

	// Busca todas as plataformas ao carregar a página
	useEffect(() => {
		getPlatforms();
		getFetchers();
	}, [getPlatforms, getFetchers]);

	return (
		<div className="min-h-screen bg-gray-900 text-gray-200">
			<div className="container mx-auto px-4 py-8">
				<header className="mb-8 flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold text-gray-100">
							Status Plataform
						</h1>
						<p className="text-gray-400 mt-2">
							Análise de status de plataformas de software
						</p>
					</div>
					<div className="flex gap-4">
						<Button onClick={openCreateModal}>
							<svg
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							Criar Nova
						</Button>
						<Button variant="destructive" onClick={handleLogout}>
							<svg
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							Logout
						</Button>
					</div>
				</header>

				{/* Tabela de plataformas */}
				<div className="bg-gray-800 rounded-lg overflow-hidden">
					<div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 font-bold text-gray-100">
						<span>Nome</span>
						<span className="col-span-2">URL</span>
						<span>Tipo</span>
						<span className="text-center">Ações</span>
					</div>

					{platforms.length === 0 ? (
						<div className="p-8 text-center text-gray-400">
							<svg
								className="h-12 w-12 mx-auto mb-4 text-gray-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
								/>
							</svg>
							<p className="text-lg">Nenhuma plataforma cadastrada</p>
							<p className="text-sm">
								Clique em "Criar Nova" para adicionar uma plataforma.
							</p>
						</div>
					) : (
						platforms.map((platform) => (
							<div
								key={platform._id}
								className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 hover:bg-gray-750 transition-colors"
							>
								<span className="font-medium text-gray-200">
									{platform.name}
								</span>
								<span className="col-span-2">
									<a
										href={platform.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-400 hover:text-blue-300 hover:underline"
									>
										{platform.url}
									</a>
								</span>
								<span className="text-gray-300">{platform.type}</span>
								<div className="flex justify-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => openEditModal(platform)}
									>
										<svg
											className="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
										Editar
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => openDeleteModal(platform)}
									>
										<svg
											className="h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
										Excluir
									</Button>
								</div>
							</div>
						))
					)}
				</div>

				{/* Modal de confirmação de exclusão */}
				<DeleteConfirmationModal
					isOpen={deleteModal.isOpen}
					onClose={closeDeleteModal}
					onConfirm={handleDelete}
					isLoading={deleteModal.isLoading}
					itemName={deleteModal.platformToDelete?.name}
					title="Excluir plataforma"
					description={`Tem certeza que deseja excluir a plataforma "${deleteModal.platformToDelete?.name}"? Esta ação não pode ser desfeita e todos os dados associados serão perdidos permanentemente.`}
				/>

				{/* Modal de criação/edição */}
				<FormModal
					isOpen={formModal.isOpen}
					onClose={closeFormModal}
					onSubmit={handleFormSubmit}
					isEditing={formModal.isEditing}
					isLoading={formModal.isLoading}
					title={
						formModal.isEditing ? "Editar plataforma" : "Criar nova plataforma"
					}
					description={
						formModal.isEditing
							? "Edite as informações da plataforma abaixo."
							: "Preencha as informações para criar uma nova plataforma de monitoramento."
					}
					size="md"
				>
					<div className="grid gap-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Nome da Plataforma</Label>
							<Input
								id="name"
								name="name"
								placeholder="Ex: GitHub, Discord, AWS..."
								defaultValue={formModal.platformToEdit?.name || ""}
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="url">URL de Status</Label>
							<Input
								id="url"
								name="url"
								type="url"
								placeholder="https://status.exemplo.com"
								defaultValue={formModal.platformToEdit?.url || ""}
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="type">Tipo de Plataforma</Label>
							<select
								id="type"
								name="type"
								defaultValue={formModal.platformToEdit?.type || "Custom"}
								className="flex h-9 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-1 text-sm text-gray-100 shadow-sm transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
								required
							>
								{fetchers.map((fetcher) => (
									<option
										key={fetcher}
										value={fetcher}
										className="bg-gray-800 text-gray-100"
									>
										{fetcher}
									</option>
								))}
							</select>
						</div>
					</div>
				</FormModal>
			</div>
		</div>
	);
};
