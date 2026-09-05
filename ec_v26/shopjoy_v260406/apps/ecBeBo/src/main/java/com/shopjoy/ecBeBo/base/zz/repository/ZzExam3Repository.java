package com.shopjoy.ecadminapi.base.zz.repository;

import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam3;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam3Id;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzExam3Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ZzExam3Repository extends JpaRepository<ZzExam3, ZzExam3Id>, QZzExam3Repository {
}
