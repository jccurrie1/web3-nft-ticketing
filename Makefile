FRONTEND_DIR := frontend
HARDHAT_DIR := hardhat

.PHONY: start start-web start-node deploy-local update-env

start:
	@echo "Starting Hardhat node in background..."
	cd $(HARDHAT_DIR) && npx hardhat node > /dev/null 2>&1 &
	sleep 5
	@$(MAKE) deploy-local
	@echo "Starting frontend..."
	cd $(FRONTEND_DIR) && npm run dev

start-web:
	cd $(FRONTEND_DIR) && npm run dev

start-node:
	cd $(HARDHAT_DIR) && npx hardhat node

deploy-local:
	cd $(HARDHAT_DIR) && npx hardhat ignition deploy --network localhost ignition/modules/EventTicket.ts
	@$(MAKE) update-env

update-env:
	@echo "Updating frontend/.env.local with deployed address..."
	@ADDR=$$(cd $(HARDHAT_DIR) && node -e "const fs=require('fs'); const path='ignition/deployments/chain-31337/deployed_addresses.json'; if(!fs.existsSync(path)){console.error('deployed_addresses.json not found'); process.exit(1);} const data=JSON.parse(fs.readFileSync(path,'utf8')); const addr=data['EventTicketModule#EventTicket']; if(!addr){console.error('EventTicket address not found in deployed_addresses.json'); process.exit(1);} console.log(addr);"); \
	if [ -z "$$ADDR" ]; then echo "Deployed address not found. Run a local deploy first."; exit 1; fi; \
	ADDR="$$ADDR" node -e "const fs=require('fs'); const path=require('path'); const envPath=path.join(process.cwd(),'frontend/.env.local'); const addr=process.env.ADDR; let content=fs.existsSync(envPath)?fs.readFileSync(envPath,'utf8'):''; const ensure=(key,val)=>{ const re=new RegExp('^'+key+'=.*','m'); if(re.test(content)){ content=content.replace(re, key+'='+val); } else { if(content && !content.endsWith('\\n')) content+='\\n'; content+=key+'='+val+'\\n'; }}; ensure('NEXT_PUBLIC_RPC_URL','http://127.0.0.1:8545'); ensure('NEXT_PUBLIC_EVENT_TICKET_ADDRESS',addr); fs.writeFileSync(envPath, content); console.log('Updated', envPath, 'with NEXT_PUBLIC_EVENT_TICKET_ADDRESS='+addr);"
