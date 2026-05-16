package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam1Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam2Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam1;
import com.shopjoy.ecadminapi.base.zz.repository.ZzExam1Repository;
import com.shopjoy.ecadminapi.base.zz.repository.ZzExam2Repository;
import com.shopjoy.ecadminapi.base.zz.repository.ZzExam3Repository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzExam1Service {

    private final ZzExam1Repository zzExam1Repository;
    private final ZzExam2Repository zzExam2Repository;
    private final ZzExam3Repository zzExam3Repository;

    @PersistenceContext
    private EntityManager em;

    /** getById — 조회 (하위 exam2s / exam3s 포함) */
    public ZzExam1Dto.Item getById(String exam1Id) {
        ZzExam1Dto.Item dto = zzExam1Repository.selectById(exam1Id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "::" + CmUtil.svcCallerInfo(this));

        // 하위 exam2 목록
        ZzExam2Dto.Request req2 = new ZzExam2Dto.Request();
        req2.setExam1Id(exam1Id);
        dto.setExam2s(zzExam2Repository.selectList(req2));

        // 하위 exam3 목록
        ZzExam3Dto.Request req3 = new ZzExam3Dto.Request();
        req3.setExam1Id(exam1Id);
        dto.setExam3s(zzExam3Repository.selectList(req3));

        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null) */
    public ZzExam1Dto.Item getByIdOrNull(String exam1Id) {
        return zzExam1Repository.selectById(exam1Id).orElse(null);
    }

    /** findById — 엔티티 조회 */
    public ZzExam1 findById(String exam1Id) {
        return zzExam1Repository.findById(exam1Id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** existsById — 존재 확인 */
    public boolean existsById(String exam1Id) {
        return zzExam1Repository.existsById(exam1Id);
    }

    /** getList — 조회 (각 항목에 하위 exam2s / exam3s 포함) */
    public List<ZzExam1Dto.Item> getList(ZzExam1Dto.Request req) {
        List<ZzExam1Dto.Item> list = zzExam1Repository.selectList(req);
        list.forEach(this::fillChildren);
        return list;
    }

    /** getPageData — 조회 (각 항목에 하위 exam2s / exam3s 포함) */
    public ZzExam1Dto.PageResponse getPageData(ZzExam1Dto.Request req) {
        PageHelper.addPaging(req);
        ZzExam1Dto.PageResponse res = zzExam1Repository.selectPageList(req);
        if (res.getPageList() != null) res.getPageList().forEach(this::fillChildren);
        return res;
    }

    /** 하위 계층(exam2s/exam3s) 채우기 */
    private void fillChildren(ZzExam1Dto.Item item) {
        ZzExam2Dto.Request req2 = new ZzExam2Dto.Request();
        req2.setExam1Id(item.getExam1Id());
        item.setExam2s(zzExam2Repository.selectList(req2));

        ZzExam3Dto.Request req3 = new ZzExam3Dto.Request();
        req3.setExam1Id(item.getExam1Id());
        item.setExam3s(zzExam3Repository.selectList(req3));
    }

    /** create — 생성 */
    @Transactional
    public ZzExam1 create(ZzExam1 body) {
        if (body.getExam1Id() == null || body.getExam1Id().isBlank())
            throw new CmBizException("exam1Id 는 필수입니다." + "::" + CmUtil.svcCallerInfo(this));
        if (zzExam1Repository.existsById(body.getExam1Id()))
            throw new CmBizException("이미 존재하는 데이터입니다: " + body.getExam1Id() + "::" + CmUtil.svcCallerInfo(this));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        ZzExam1 saved = zzExam1Repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public ZzExam1 update(String exam1Id, ZzExam1 body) {
        ZzExam1 entity = zzExam1Repository.findById(exam1Id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "::" + CmUtil.svcCallerInfo(this)));
        VoUtil.voCopyExclude(body, entity, "exam1Id^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        ZzExam1 saved = zzExam1Repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** updateSelective — 부분 수정 */
    @Transactional
    public int updateSelective(ZzExam1 entity) {
        return zzExam1Repository.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String exam1Id) {
        ZzExam1 entity = zzExam1Repository.findById(exam1Id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "::" + CmUtil.svcCallerInfo(this)));
        zzExam1Repository.delete(entity);
        em.flush();
        if (zzExam1Repository.existsById(exam1Id))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveList(List<ZzExam1> rows) {
        zzExam1Repository.saveAll(rows);
    }
}
