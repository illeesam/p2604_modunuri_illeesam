package com.shopjoy.ecBeBo.base.zz.repository;

import com.shopjoy.ecBeBo.base.zz.data.entity.ZzExam2;
import com.shopjoy.ecBeBo.base.zz.data.entity.ZzExam2Id;
import com.shopjoy.ecBeBo.base.zz.repository.qrydsl.QZzExam2Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ZzExam2Repository extends JpaRepository<ZzExam2, ZzExam2Id>, QZzExam2Repository {
}
