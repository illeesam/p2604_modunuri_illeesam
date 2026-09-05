package com.shopjoy.ecBeBo.base.ec.cm.repository;

import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmChattMsg;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.QCmChattMsgRepository;

public interface CmChattMsgRepository extends JpaRepository<CmChattMsg, String>, QCmChattMsgRepository {
}
