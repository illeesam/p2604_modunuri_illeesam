package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam3;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam3Id;
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
public class ZzExam3Service {

    private final ZzExam1Repository zzExam1Repository;
    private final ZzExam2Repository zzExam2Repository;
    private final ZzExam3Repository zzExam3Repository;

    @PersistenceContext
    private EntityManager em;

    private ZzExam3Id pk(String exam1Id, String exam2Id, String exam3Id) {
        return new ZzExam3Id(exam1Id, exam2Id, exam3Id);
    }

    /** getById — 조회 (복합 PK, 상위 exam1 / exam2 포함) */
    public ZzExam3Dto.Item getById(String exam1Id, String exam2Id, String exam3Id) {
        ZzExam3Dto.Item dto = zzExam3Repository.selectById(exam1Id, exam2Id, exam3Id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "/" + exam2Id + "/" + exam3Id + "::" + CmUtil.svcCallerInfo(this));

        // 상위 exam1 단건
        dto.setExam1(zzExam1Repository.selectById(exam1Id).orElse(null));
        // 상위 exam2 단건
        dto.setExam2(zzExam2Repository.selectById(exam1Id, exam2Id).orElse(null));

        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null) */
    public ZzExam3Dto.Item getByIdOrNull(String exam1Id, String exam2Id, String exam3Id) {
        return zzExam3Repository.selectById(exam1Id, exam2Id, exam3Id).orElse(null);
    }

    /** findById — 엔티티 조회 */
    public ZzExam3 findById(String exam1Id, String exam2Id, String exam3Id) {
        return zzExam3Repository.findById(pk(exam1Id, exam2Id, exam3Id))
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "/" + exam2Id + "/" + exam3Id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** existsById — 존재 확인 */
    public boolean existsById(String exam1Id, String exam2Id, String exam3Id) {
        return zzExam3Repository.existsById(pk(exam1Id, exam2Id, exam3Id));
    }

    /** getList — 조회 */
    public List<ZzExam3Dto.Item> getList(ZzExam3Dto.Request req) {
        return zzExam3Repository.selectList(req);
    }

    /** getPageData — 조회 */
    public ZzExam3Dto.PageResponse getPageData(ZzExam3Dto.Request req) {
        PageHelper.addPaging(req);
        return zzExam3Repository.selectPageList(req);
    }

    /** create — 생성 */
    @Transactional
    public ZzExam3 create(ZzExam3 body) {
        if (body.getExam1Id() == null || body.getExam1Id().isBlank()
                || body.getExam2Id() == null || body.getExam2Id().isBlank()
                || body.getExam3Id() == null || body.getExam3Id().isBlank())
            throw new CmBizException("exam1Id, exam2Id, exam3Id 는 필수입니다." + "::" + CmUtil.svcCallerInfo(this));
        if (zzExam3Repository.existsById(pk(body.getExam1Id(), body.getExam2Id(), body.getExam3Id())))
            throw new CmBizException("이미 존재하는 데이터입니다: " + body.getExam1Id() + "/" + body.getExam2Id() + "/" + body.getExam3Id() + "::" + CmUtil.svcCallerInfo(this));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        ZzExam3 saved = zzExam3Repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public ZzExam3 update(String exam1Id, String exam2Id, String exam3Id, ZzExam3 body) {
        ZzExam3 entity = zzExam3Repository.findById(pk(exam1Id, exam2Id, exam3Id))
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "/" + exam2Id + "/" + exam3Id + "::" + CmUtil.svcCallerInfo(this)));
        VoUtil.voCopyExclude(body, entity, "exam1Id^exam2Id^exam3Id^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        ZzExam3 saved = zzExam3Repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** updateSelective — 부분 수정 */
    @Transactional
    public int updateSelective(ZzExam3 entity) {
        return zzExam3Repository.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String exam1Id, String exam2Id, String exam3Id) {
        ZzExam3 entity = zzExam3Repository.findById(pk(exam1Id, exam2Id, exam3Id))
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "/" + exam2Id + "/" + exam3Id + "::" + CmUtil.svcCallerInfo(this)));
        zzExam3Repository.delete(entity);
        em.flush();
        if (zzExam3Repository.existsById(pk(exam1Id, exam2Id, exam3Id)))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveList(List<ZzExam3> rows) {
        zzExam3Repository.saveAll(rows);
    }
}
