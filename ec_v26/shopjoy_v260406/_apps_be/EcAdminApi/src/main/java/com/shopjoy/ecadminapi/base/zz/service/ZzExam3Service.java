package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam1Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam2Dto;
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
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzExam3Service {

    private final ZzExam1Repository zzExam1Repository;
    private final ZzExam2Repository zzExam2Repository;
    private final ZzExam3Repository zzExam3Repository;

    @PersistenceContext
    private EntityManager em;

    /* zz_exam3 pk */
    private ZzExam3Id pk(String exam1Id, String exam2Id, String exam3Id) {
        return new ZzExam3Id(exam1Id, exam2Id, exam3Id);
    }

    /** getById — 조회 (복합 PK, 상위 exam1 / exam2 포함) */
    public ZzExam3Dto.Item getById(String exam1Id, String exam2Id, String exam3Id) {
        ZzExam3Dto.Item dto = zzExam3Repository.selectById(exam1Id, exam2Id, exam3Id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "/" + exam2Id + "/" + exam3Id + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(dto);
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

    /** getList — 조회 (각 항목에 상위 exam1 / exam2 포함) */
    public List<ZzExam3Dto.Item> getList(ZzExam3Dto.Request req) {
        List<ZzExam3Dto.Item> list = zzExam3Repository.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /** getPageData — 조회 (각 항목에 상위 exam1 / exam2 포함) */
    public ZzExam3Dto.PageResponse getPageData(ZzExam3Dto.Request req) {
        PageHelper.addPaging(req);
        ZzExam3Dto.PageResponse res = zzExam3Repository.selectPageList(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (exam1 단건 / exam2 단건을 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 exam1 1회 + exam2 1회만 조회한다.
     */
    private void _listFillRelations(List<ZzExam3Dto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> exam1Ids = list.stream()
            .map(ZzExam3Dto.Item::getExam1Id)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (exam1Ids.isEmpty()) return;

        // 상위 exam1 일괄조회 → Map<exam1Id, exam1>
        ZzExam1Dto.Request req1 = new ZzExam1Dto.Request();
        req1.setExam1Ids(exam1Ids);
        Map<String, ZzExam1Dto.Item> exam1Map = zzExam1Repository.selectList(req1).stream()
            .collect(Collectors.toMap(ZzExam1Dto.Item::getExam1Id, x -> x, (a, b) -> a));

        // 상위 exam2 일괄조회 → Map<exam1Id|exam2Id, exam2>
        ZzExam2Dto.Request req2 = new ZzExam2Dto.Request();
        req2.setExam1Ids(exam1Ids);
        Map<String, ZzExam2Dto.Item> exam2Map = zzExam2Repository.selectList(req2).stream()
            .collect(Collectors.toMap(x -> x.getExam1Id() + "|" + x.getExam2Id(), x -> x, (a, b) -> a));

        // 각 항목에 분배
        for (ZzExam3Dto.Item item : list) {
            item.setExam1(exam1Map.get(item.getExam1Id())); // exam1 단건
            item.setExam2(exam2Map.get(item.getExam1Id() + "|" + item.getExam2Id())); // exam2 단건
        }
    }

    /** 상위 계층(exam1 / exam2) 채우기 */
    private void _itemFillRelations(ZzExam3Dto.Item item) {
        // 상위 exam1 단건 조회 (exam1Id 기준)
        item.setExam1(zzExam1Repository.selectById(item.getExam1Id()).orElse(null)); // exam1 단건

        // 상위 exam2 단건 조회 (exam1Id + exam2Id 기준)
        item.setExam2(zzExam2Repository.selectById(item.getExam1Id(), item.getExam2Id()).orElse(null)); // exam2 단건
    }

    /** create — 생성 */
    @Transactional
    public ZzExam3 create(ZzExam3 body) {
        if (body.getExam1Id() == null || body.getExam1Id().isBlank()
                || body.getExam2Id() == null || body.getExam2Id().isBlank())
            throw new CmBizException("exam1Id, exam2Id 는 필수입니다." + "::" + CmUtil.svcCallerInfo(this));
        body.setExam3Id(CmUtil.generateId("zz_exam3"));
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
