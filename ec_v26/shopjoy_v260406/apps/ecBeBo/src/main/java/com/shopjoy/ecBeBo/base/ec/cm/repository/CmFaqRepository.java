package com.shopjoy.ecBeBo.base.ec.cm.repository;

import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmFaq;
import com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.QCmFaqRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CmFaqRepository extends JpaRepository<CmFaq, String>, QCmFaqRepository {
}
