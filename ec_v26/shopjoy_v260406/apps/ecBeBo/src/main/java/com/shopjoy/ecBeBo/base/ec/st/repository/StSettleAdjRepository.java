package com.shopjoy.ecBeBo.base.ec.st.repository;

import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleAdj;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.QStSettleAdjRepository;

import java.util.List;

public interface StSettleAdjRepository extends JpaRepository<StSettleAdj, String>, QStSettleAdjRepository {

    /** 정산ID 기준 승인된 조정항목 (aprvStatusCd=APPROVED) */
    List<StSettleAdj> findBySettleIdAndAprvStatusCd(String settleId, String aprvStatusCd);
}
