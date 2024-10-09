import {
	AlertDialog,
	AlertDialogBody,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	Avatar,
	AvatarBadge,
	Box,
	Button,
	Flex,
	Image,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Portal,
	Stack,
	Text,
	WrapItem,
	useColorMode,
	useColorModeValue,
	useDisclosure,
} from "@chakra-ui/react";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { BsCheck2All, BsFillImageFill } from "react-icons/bs";
import { selectedConversationAtom , conversationsAtom } from "../atoms/messagesAtom";
import React from "react";
import useShowToast from "../hooks/useShowToast";
// import { useState } from "react";
// import { ChevronDownIcon, DeleteIcon, MinusIcon} from '@chakra-ui/icons'

const Conversation = ({ conversation, isOnline }) => {
	const user = conversation.participants[0];
	const currentUser = useRecoilValue(userAtom);
	const lastMessage = conversation.lastMessage;
	const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
	const [conversations,setConversations] = useRecoilState(conversationsAtom)
	const colorMode = useColorMode();
	const { isOpen, onOpen, onClose } = useDisclosure()
	const cancelRef = React.useRef()
	const showToast = useShowToast();
	// const [deleteConversation, setDeleteConversation] = useState(false)

	console.log("selectedConverstion", selectedConversation);
	const handleDelete = async () => {
		try {
			const res = await fetch("http://localhost:3000/api/messages/conversations/" + conversation._id,{
				method: "DELETE",
			})
			const data = await res.json()
			if(data.error){
				showToast("Error", res.error, "error")
				return
			}
			setSelectedConversation({
				_id: "",
				userId: "",
				username: "",
				userProfilePic: "",
			})
			setConversations(conversations.filter((c)=>c._id !== conversation._id))
			onClose()
			showToast("Success", "Conversation deleted", "success")
			console.log(data)


		} catch (error) {
			console.log(error)
			showToast("Error", error.message, "error")
		}
	}
	return (
		<>
			<Flex
				gap={4}
				alignItems={"center"}
				p={"1"}
				_hover={{
					cursor: "pointer",
					bg: useColorModeValue("gray.600", "gray.dark"),
					color: "white",
				}}
				onClick={() =>
					setSelectedConversation({
						_id: conversation._id,
						userId: user._id,
						userProfilePic: user.profilePic,
						username: user.username,
						mock: conversation.mock,
					})
				}
				bg={
					selectedConversation?._id === conversation._id ? (colorMode === "light" ? "gray.400" : "gray.dark") : ""
				}
				borderRadius={"md"}
			>
				<WrapItem>
					<Avatar
						size={{
							base: "xs",
							sm: "sm",
							md: "md",
						}}
						src={user.profilePic}
					>
						{isOnline ? <AvatarBadge boxSize='1em' bg='green.500' /> : ""}
					</Avatar>
				</WrapItem>

				<Stack direction={"column"} fontSize={"sm"}>
					<Text fontWeight='700' display={"flex"} alignItems={"center"}>
						{user.username} <Image src='/verified.png' w={4} h={4} ml={1} />
					</Text>
					<Text fontSize={"xs"} display={"flex"} alignItems={"center"} gap={1}>
						{currentUser._id === lastMessage.sender ? (
							<Box color={lastMessage.seen ? "blue.400" : ""}>
								<BsCheck2All size={16} />
							</Box>
						) : (
							""
						)}
						{lastMessage.text.length > 18
							? lastMessage.text.substring(0, 18) + "..."
							: lastMessage.text || <BsFillImageFill size={16} />}
					</Text>
				</Stack>
				<Stack direction={"column"} ml={10} pr={5}>
					<Menu w={10}>
						<MenuButton >...</MenuButton>
						<Portal w={10}>
							<MenuList >
								<MenuItem minWidth={10} onClick={onOpen}>Delete</MenuItem>
							</MenuList>
						</Portal>
					</Menu>
					<AlertDialog
						isOpen={isOpen}
						leastDestructiveRef={cancelRef}
						onClose={onClose}
					>
						<AlertDialogOverlay>
							<AlertDialogContent>
								<AlertDialogHeader fontSize='lg' fontWeight='bold'>
									Delete Conversation
								</AlertDialogHeader>

								<AlertDialogBody>
									Are you sure ?
								</AlertDialogBody>

								<AlertDialogFooter>
									<Button ref={cancelRef} onClick={onClose}>
										Cancel
									</Button>
									<Button colorScheme='red' onClick={handleDelete} ml={3}>
										Delete
									</Button>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialogOverlay>
					</AlertDialog>
				</Stack>
			</Flex>
		</>
	);
};

export default Conversation;
